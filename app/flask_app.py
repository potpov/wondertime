from flask import Flask, render_template, make_response, got_request_exception
from flask_wtf.csrf import CSRFProtect
from flask import jsonify
import requests_toolbelt.adapters.appengine
from models import model
from flask_restful import Api, Resource, reqparse
from flask_webpack import Webpack
import flask_project_config
from google.appengine.ext import ndb
from google.appengine.ext import blobstore
from flask import request
from werkzeug.http import parse_options_header
import json
import datetime
from jinja2 import utils
import requests
from exceptions import InvalidUsage

webpack = Webpack()
app = Flask(__name__)
app.config.from_object(__name__)


app.config.update(flask_project_config.app_params)

csrf_protect = CSRFProtect(app)
api = Api(app, decorators=[csrf_protect.exempt])
webpack.init_app(app)

# Use the App Engine Requests adapter. This makes sure that Requests uses URLFetch.
requests_toolbelt.adapters.appengine.monkeypatch()

'''
@app.errorhandler(Exception)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response
    

app.register_error_handler(InvalidUsage, handle_invalid_usage)
'''


@app.route("{}/<bkey>".format(flask_project_config.MEDIA_PUB_DIR))
def img(bkey):
    blob_info = blobstore.get(bkey)
    response = make_response(blob_info.open().read())
    response.headers['Content-Type'] = blob_info.content_type
    return response


@app.route('/', defaults={'path': ''}, methods=['GET', 'POST'])
@app.route('/<path:path>')
def index(path):
    return render_template('index.html', gmaps_api=flask_project_config.MAPS_KEY)


class CreateUser(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('username', type=str, required=True)
        self.parser.add_argument('password', type=str, required=True)
        self.parser.add_argument('email', type=str, required=True)

    def post(self):
        try:
            args = self.parser.parse_args()
            result = model.User.create_new_user(args.username.lower(), args.email.lower(), args.password)
            return jsonify(result)
        except InvalidUsage as e:
            return {'error': e.args[0]}


class LoginUser(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('username', type=str, required=True)
        self.parser.add_argument('password', type=str, required=True)

    def post(self):
        try:
            args = self.parser.parse_args()
            result = model.User.login_user(args.username.lower(), args.password)
            return make_response(jsonify(result), 200)
        except InvalidUsage as e:
            return {'error': e.args[0]}


class LoadUser(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument(
            'Authorization',
            type=str,
            location='headers',
            required=True,
            help='auth token required to view this page'
        )

    def get(self):
        try:
            args = self.parser.parse_args()
            token = args.Authorization.split(" ")[1]
            result = model.User.load_user_by_token(token)
            if isinstance(result, model.User):
                return jsonify({'user': result.username})
            raise InvalidUsage('unable to obtain user')
        except InvalidUsage as e:
            return {'error': e.args[0]}


class UpdatePassword(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument(
            'Authorization',
            type=str,
            location='headers',
            required=True,
            help='auth token required to view this page'
        )
        self.parser.add_argument('password', type=str, required=True)

    def post(self):
        try:
            args = self.parser.parse_args()
            token = args.Authorization.split(" ")[1]
            user = model.User.load_user_by_token(token)
            user.change_password(args.password)
            return {'message': 'password updated.'}
        except InvalidUsage as e:
            return {'error': e.args[0]}


class UserDetails(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('Authorization', type=str, location='headers', required=True)

    def get(self):
        try:
            args = self.parser.parse_args()
            token = args.Authorization.split(" ")[1]
            result = model.User.load_user_by_token(token)
            return jsonify({
                'username': result.username,
                'email': result.email,
                'registered_on': result.registered_on
            })
        except InvalidUsage as e:
            return {'error': e.args[0]}


class LogoutUser(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('Authorization', type=str, location='headers', required=True)

    def post(self):
        try:
            args = self.parser.parse_args()
            token = args.Authorization.split(" ")[1]
            result = model.User.load_user_by_token(token)  # just checking there's a token to invalidate
            if isinstance(result, model.User):
                model.Blacklist(token=token).put()
                return {'message': 'user logged out successfully'}
            raise InvalidUsage('unable to logout user.')
        except InvalidUsage as e:
            return {'error': e.args[0]}


class SearchUser(Resource):

    def get(self, username):
        try:
            safe_user = utils.escape(username.encode('utf-8').strip()).lower()
            limit = safe_user[:-1] + chr(ord(safe_user[-1]) + 1)
            results = model.User.query(
                model.User.username >= safe_user,
                model.User.username < limit,
            ).fetch(50)

            return jsonify(
                [{'hint': result.username} for result in results]
            )

        except InvalidUsage as e:
            return {'error': e.args[0]}


class FollowToggle(Resource):
    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('Authorization', type=str, location='headers', required=True)
        self.parser.add_argument('action', type=str, required=True)
        self.parser.add_argument('target', type=str, required=True)

    def post(self):
        try:
            args = self.parser.parse_args()
            token = args.Authorization.split(" ")[1]
            user = model.User.load_user_by_token(token)  # just checking there's a token to invalidate
            if args.action == 'UNFOLLOW':  # toggle -> delete this follow
                relationships = model.Followers.query(ancestor=user.key).filter(
                    model.Followers.followed == args.target
                ).fetch()
                for rel in relationships:
                    rel.key.delete()
            elif args.action == 'FOLLOW':  # toggle -> create a new relathionship
                model.Followers(
                    parent=user.key,
                    followed=args.target,
                ).put()
            else:
                raise InvalidUsage('no valid action provided')
            return {'message': 'relationship updated'}
        except InvalidUsage as e:
            return {'error': e.args[0]}


class CreateTimeline(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('title', type=str, required=True)
        self.parser.add_argument('Authorization', type=str, location='headers', required=True)

    def post(self):
        try:
            args = self.parser.parse_args()
            token = args.Authorization.split(" ")[1]
            user = model.User.load_user_by_token(token)
            if not isinstance(user, model.User):
                raise InvalidUsage('unable to obtain user')
            # escape of xss inputs
            title = str(utils.escape(args.title.strip()))
            timeline = model.Timeline(
                parent=user.key,
                title=title,
            )
            timeline.put()
            return {
                'message': 'timeline created',
                'hash': timeline.key.urlsafe()
            }
        except InvalidUsage as e:
            return {'error': e.args[0]}


class MakeTimelinePublic(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('timeline_hash', type=str, required=True)
        self.parser.add_argument('Authorization', type=str, location='headers', required=True)

    def post(self):
        try:
            args = self.parser.parse_args()
            token = args.Authorization.split(" ")[1]
            user = model.User.load_user_by_token(token)
            if not isinstance(user, model.User):
                raise InvalidUsage('unable to obtain user')
            timeline = model.Timeline.load_timeline(entity_key=args.timeline_hash)
            if not isinstance(timeline, model.Timeline):
                raise InvalidUsage('unable to obtain timeline')
            if timeline.key.parent() == user.key:  # check if the auth user is also admin for this timeline
                timeline.is_public = True
                timeline.put()
                return {'message': 'timeline is now public'},
            else:
                raise InvalidUsage('permission denied')
        except InvalidUsage as e:
            return {'error': e.args[0]}


class DeleteTimeline(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('timeline_hash', type=str, required=True)
        self.parser.add_argument('Authorization', type=str, location='headers', required=True)

    def post(self):
        try:
            args = self.parser.parse_args()
            token = args.Authorization.split(" ")[1]
            user = model.User.load_user_by_token(token)
            if not isinstance(user, model.User):
                raise InvalidUsage('unable to obtain user')
            timeline = model.Timeline.load_timeline(entity_key=args.timeline_hash)
            if not isinstance(timeline, model.Timeline):
                raise InvalidUsage('unable to obtain timeline')
            if timeline.key.parent() == user.key:  # check if the auth user is also admin for this timeline
                timeline.active = False
                timeline.put()
                return {'message': 'timeline deleted successfully'},
            else:
                raise InvalidUsage('permission denied')
        except InvalidUsage as e:
            return {'error': e.args[0]}


class LoadTimeline(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('Authorization', type=str, location='headers', required=False)

    def get(self, timeline_hash):
        try:
            if not timeline_hash:
                raise InvalidUsage('no timeline specified')
            args = self.parser.parse_args()
            timeline = model.Timeline.load_timeline(entity_key=timeline_hash)
            if not isinstance(timeline, model.Timeline):
                raise InvalidUsage('unable to obtain timeline')
            #  auth part
            if not args.Authorization:
                is_admin = False
            else:
                token = args.Authorization.split(" ")[1]
                user = model.User.load_user_by_token(token)
                if isinstance(user, model.User):
                    if timeline.key.parent() == user.key:
                        is_admin = True
                    else:
                        is_admin = False
                else:
                    raise InvalidUsage('unable to obtain user')

            #  deny access to private timelines
            if not timeline.is_public and not is_admin:
                raise InvalidUsage('this timeline is not public')

            #  collecting infos
            medias = model.Media.query(
                ancestor=timeline.key
            ).order(model.Media.sequence).filter(model.Media.active == True)
            result = []
            for media in medias:
                #  creating list of files for this media
                files = []
                for file_url in model.File.query(ancestor=media.key):
                    files.append('{}/{}'.format(flask_project_config.MEDIA_PUB_DIR, file_url.blob_url))
                #  adding the media to the media response list
                if media.lat and media.lon:
                    coords = {
                        'lat': media.lat,
                        'lng': media.lon,
                    }
                else:
                    coords = {'lat': 'undefined', 'lng': 'undefined'}

                result.append({
                    'sequence': media.sequence,
                    'type': media.type,
                    'caption': media.caption,
                    'coords': coords,
                    'url': files,
                })

            if medias.count() > 0:
                next_seq = model.Media.query(ancestor=timeline.key).order(-model.Media.sequence).get().sequence + 1
            else:
                next_seq = 0

            return jsonify({
                'admin': is_admin,
                'media': list(result),
                'nextSeq': next_seq
            })
        except InvalidUsage as e:
            return {'error': e.args[0]}


class UpdateTimeline(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('to_be_removed', required=True, type=json.loads)
        self.parser.add_argument('timeline_hash', type=str, required=True)
        self.parser.add_argument('items_tree', required=True, type=json.loads)
        self.parser.add_argument('Authorization', type=str, location='headers', required=False)

    def post(self):
        try:
            args = self.parser.parse_args()
            # handling all possible errors first
            timeline = model.Timeline.load_timeline(entity_key=args.timeline_hash)
            if not isinstance(timeline, model.Timeline):
                raise InvalidUsage('unable to obtain timeline')
            token = args.Authorization.split(" ")[1]
            user = model.User.load_user_by_token(token)
            if not isinstance(user, model.User):
                raise InvalidUsage('unable to obtain user')
            if timeline.key.parent() != user.key:  # problems with permissions
                raise InvalidUsage('you are not allowed to edit this timeline')
            # ready to go. let's begin from the files to be deleted
            if args.to_be_removed:
                remove_these = model.Media.query(
                    ancestor=timeline.key
                ).filter(model.Media.sequence.IN(args.to_be_removed))
                for remove_me in remove_these:
                    remove_me.active = False
                    remove_me.put()
            # adding new elements
            for card in args.items_tree:
                if card['new']:
                    # filtering all the inputs
                    if not isinstance(card['sequence'], (int, long)):
                        raise InvalidUsage('timeline partially updated. suspicious input detected.')
                    if card['type'] not in ['picture', 'caption', 'video', 'gallery']:
                        raise InvalidUsage('dont try to hack me plsss.')
                    caption = utils.escape(card['caption'].encode('utf-8').strip())
                    # skip empty captions
                    if card['type'] == 'caption' and len(caption) == 0:
                        continue
                    # end of first controls
                    media = model.Media(
                        parent=timeline.key,
                        sequence=card['sequence'],
                        type=str(card['type']),
                        caption=caption,
                    )
                    # asking google for coords if there are
                    if card['place_id']:
                        params = {'key': flask_project_config.MAPS_KEY, 'placeid': card['place_id']}
                        r = requests.get('https://maps.googleapis.com/maps/api/place/details/json', params=params)
                        place_details = r.json()
                        if place_details['status'] == 'OK':
                            media.lat = place_details['result']['geometry']['location']['lat']
                            media.lon = place_details['result']['geometry']['location']['lng']
                            media.place_name = str(card['place_name'])
                    media.put()
                    # saving all the uploads attached to this media
                    if card['source']:
                        for source in card['source']:
                            f = request.files[source]
                            header = f.headers['Content-Type']
                            parsed_header = parse_options_header(header)
                            blob_key = parsed_header[1]['blob-key']
                            model.File(
                                parent=media.key,
                                blob_url=blobstore.BlobKey(blob_key)
                            ).put()
            return {'message': 'timeline updated successfully'}
        except InvalidUsage as e:
            return {'error': e.args[0]}


class LoadTimelines(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('Authorization', type=str, location='headers', required=True)

    def get(self, username=None):
        try:
            args = self.parser.parse_args()
            token = args.Authorization.split(" ")[1]
            # checking if the user is authenticated
            user = model.User.load_user_by_token(token)
            # switch: if username is specified we load this username's timelines
            # otherwise we keep loading the authenticated user's timelines.
            if username:
                myuser = user
                user = model.User.load_user_by_username(username)
                is_following = model.Followers.isFollowing(myuser, user)
                is_admin = False
            else:
                is_admin = True
                is_following = True  # always follow yourself

            if isinstance(user, model.User):
                response = []
                query = model.Timeline.query(ancestor=user.key).filter(model.Timeline.active == True)
                # if it is not our personal page let's hide private timelines
                if not is_admin:
                    query = query.filter(model.Timeline.is_public == True)
                results = query.fetch()

                for timeline in results:
                    # loading GPS locations
                    gps = []
                    medias = model.Media.query(
                        ancestor=timeline.key,
                        projection=["lat", "lon", "sequence"],
                    ).order(model.Media.sequence).filter(model.Media.active == True)

                    for media in medias:
                        if media.lat and media.lon:
                            gps.append({
                                'lat': media.lat,
                                'lng': media.lon,
                            })
                    response.append({
                        'creation_date': datetime.datetime.strftime(timeline.creation_date, '%d/%m/%y'),
                        'title': timeline.title,
                        'hash': timeline.key.urlsafe(),
                        'isPublic': timeline.is_public,
                        'positions': gps
                    })
                return jsonify({
                    'timelines': response,
                    'is_admin': is_admin,
                    'is_following': is_following
                })
            raise InvalidUsage('unable to obtain user')  # error message here
        except InvalidUsage as e:
            return {'error': e.args[0]}


class GetBlobEntry(Resource):
    def get(self, action):
        try:
            if action == 'create':
                return {'url': blobstore.create_upload_url('/API/timeline/create')}
            if action == 'update':
                return {'url': blobstore.create_upload_url('/API/timeline/update')}
            raise InvalidUsage('invalid request')
        except InvalidUsage as e:
            return {'error': e.args[0]}


class SearchPlace(Resource):

    def get(self, place):
        try:
            safe_place = utils.escape(place.encode('utf-8').strip())
            params = {'key': flask_project_config.MAPS_KEY, 'input': safe_place}
            r = requests.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', params=params)
            result = r.json()
            hints = []
            for prediction in result['predictions']:
                hints.append({
                    'hint': prediction['description'],
                    'key': prediction['place_id']
                  })
            return jsonify(hints)
        except InvalidUsage as e:
            return {'error': e.args[0]}


class MatchPlace(Resource):
    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('lon', type=int, required=True)
        self.parser.add_argument('lat', type=int, required=True)

    def get(self):
        args = self.parser.parse_args()
        lat = float(args.lat % 360)
        lon = float(args.lon % 360)

        lat_medias = model.Media.query(
            ndb.AND(
                model.Media.lat < lat + 1,
                model.Media.lat > lat - 1,
            )
        ).fetch(keys_only=True)

        lon_medias = model.Media.query(
            ndb.AND(
                model.Media.lon > lon - 1,
                model.Media.lon < lon + 1
            )
        ).fetch(keys_only=True)

        # keys of cards in both lon/lat
        results = ndb.get_multi(set(lon_medias).intersection(lat_medias))

        response = []
        for result in results:
            timeline = result.key.parent().get()
            response.append({
                'title': timeline.title,
            })
        response = set(response)
        return jsonify({
            'non ci posso credere, la signorina del navigatoreee ': response
        })


class CreateFeed(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('Authorization', type=str, location='headers', required=True)

    def get(self):
        try:
            args = self.parser.parse_args()
            token = args.Authorization.split(" ")[1]
            # checking if the user is authenticated
            user = model.User.load_user_by_token(token)
            if isinstance(user, model.User):
                response = []
                followed = model.Followers.query(
                    ancestor=user.key
                )
                feed = []
                for fol in followed:
                    for fol_tl in model.Timeline.query(
                                    model.Timeline.is_public == True,
                                    ancestor=ndb.Key(model.User, fol.followed),
                                    ).order(-model.Timeline.creation_date).fetch(3):
                        gps = []
                        for fol_tl_media in model.Media.query(
                                                ancestor=fol_tl.key,
                                                projection=["location", "sequence"],
                                            ).order(model.Media.sequence).filter(
                                                    model.Media.active == True):
                            if fol_tl_media.location:
                                gps.append({
                                    'lat': fol_tl_media.location.lat,
                                    'lng': fol_tl_media.location.lon,
                                })
                        feed.append({
                            'creator': fol.followed,
                            'creation_date': fol_tl.creation_date,
                            'title': fol_tl.title,
                            'hash': fol_tl.key.urlsafe(),
                            'isPublic': fol_tl.is_public,
                            'positions': gps
                        })

                return jsonify(feed)
            raise InvalidUsage('unable to obtain user')  # error message here
        except InvalidUsage as e:
            return {'error': e.args[0]}


""" USER APIs """
api.add_resource(CreateUser, '/API/user/signup')
api.add_resource(LoginUser, '/API/user/signin')
api.add_resource(LoadUser, '/API/user/auth')
api.add_resource(SearchUser, '/API/user/search/<string:username>')
api.add_resource(LogoutUser, '/API/user/logout')
api.add_resource(UpdatePassword, '/API/user/update')
api.add_resource(UserDetails, '/API/user/details/')

api.add_resource(FollowToggle, '/API/user/relationship/toggle')
api.add_resource(CreateFeed, '/API/user/relationship/feed')


""" TIMELINE APIs """
api.add_resource(CreateTimeline, '/API/timeline/create')
api.add_resource(DeleteTimeline, '/API/timeline/delete')
api.add_resource(MakeTimelinePublic, '/API/timeline/publish')
api.add_resource(UpdateTimeline, '/API/timeline/update')
api.add_resource(LoadTimeline, '/API/timeline/load/<string:timeline_hash>')
api.add_resource(
    LoadTimelines,
    '/API/timelines/load/',
    '/API/timelines/load/<string:username>'
)


""" BLOB APIs """
api.add_resource(GetBlobEntry, '/API/blob/action/<string:action>')


""" MAPS APIs """
api.add_resource(SearchPlace, '/API/place/search/<string:place>')
api.add_resource(MatchPlace, '/API/place/neighbours/')

