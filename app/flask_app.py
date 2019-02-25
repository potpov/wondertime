from flask import Flask, render_template, make_response
from flask_api import status
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


@app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


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
        args = self.parser.parse_args()
        result = model.User.create_new_user(args.username, args.email, args.password)
        return jsonify(result)


class LoginUser(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('username', type=str, required=True)
        self.parser.add_argument('password', type=str, required=True)

    def post(self):
        args = self.parser.parse_args()
        result = model.User.login_user(args.username, args.password)
        return make_response(jsonify(result), 200)


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
        args = self.parser.parse_args()
        token = args.Authorization.split(" ")[1]
        result = model.User.load_user_by_token(token)
        if isinstance(result, model.User):
            return jsonify({'user': result.username})
        raise InvalidUsage('unable to obtain user')


class LogoutUser(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('Authorization', type=str, location='headers', required=True)

    def post(self):
        args = self.parser.parse_args()
        token = args.Authorization.split(" ")[1]
        result = model.User.load_user_by_token(token)  # just checking there's a token to invalidate
        if isinstance(result, model.User):
            model.Blacklist(token=token).put()
            return {'message': 'user logged out successfully'}
        raise InvalidUsage('unable to logout user.')


class CreateTimeline(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('title', type=str, required=True)
        self.parser.add_argument('Authorization', type=str, location='headers', required=True)

    def post(self):
        args = self.parser.parse_args()
        token = args.Authorization.split(" ")[1]
        user = model.User.load_user_by_token(token)
        if not isinstance(user, model.User):
            raise InvalidUsage('unable to obtain user')
        # creating the timeline
        model.Timeline(
            parent=user.key,
            title=args.title,
        ).put()
        return {'success': 'timeline created'}


class MakeTimelinePublic(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('timeline_hash', type=str, required=True)
        self.parser.add_argument('Authorization', type=str, location='headers', required=True)

    def post(self):
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


class LoadTimeline(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('Authorization', type=str, location='headers', required=False)

    def get(self, timeline_hash):
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
            result.append({
                'sequence': media.sequence,
                'type': media.type,
                'caption': media.caption,
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


class UpdateTimeline(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('to_be_removed', required=True, type=json.loads)
        self.parser.add_argument('timeline_hash', type=str, required=True)
        self.parser.add_argument('items_tree', required=True, type=json.loads)
        self.parser.add_argument('Authorization', type=str, location='headers', required=False)

    def post(self):
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
                # asking google for coords
                params = {'key': flask_project_config.MAPS_KEY, 'placeid': card['place_id']}
                r = requests.get('https://maps.googleapis.com/maps/api/place/details/json', params=params)
                place_details = r.json()
                lat = place_details['result']['geometry']['location']['lat']
                lng = place_details['result']['geometry']['location']['lng']
                media = model.Media(
                    parent=timeline.key,
                    sequence=card['sequence'],
                    type=str(card['type']),
                    caption=card['caption'].encode('utf-8'),
                    place_name=str(card['place_name']),
                    location=ndb.GeoPt(lat, lng)
                )
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


class LoadTimelines(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('Authorization', type=str, location='headers', required=True)

    def get(self):
        args = self.parser.parse_args()
        token = args.Authorization.split(" ")[1]
        user = model.User.load_user_by_token(token)

        if isinstance(user, model.User):
            response = []
            query = model.Timeline.query(ancestor=user.key).filter(model.Timeline.active == True)
            results = query.fetch()

            for timeline in results:
                # loading GPS locations
                gps = []
                medias = model.Media.query(
                    ancestor=timeline.key,
                    projection=["location", "sequence"],
                ).order(model.Media.sequence).filter(model.Media.active == True)

                for media in medias:
                    gps.append({
                        'lat': media.location.lat,
                        'lng': media.location.lon,
                    })
                response.append({
                    'creation_date': timeline.creation_date,
                    'title': timeline.title,
                    'cover_url': '/media/{}'.format(timeline.cover_url),
                    'hash': timeline.key.urlsafe(),
                    'isPublic': timeline.is_public,
                    'positions': gps
                })
            return jsonify(response)
        raise InvalidUsage('unable to obtain user')  # error message here


class GetBlobEntry(Resource):
    def get(self, action):
        if action == 'create':
            return {'url': blobstore.create_upload_url('/API/timeline/create')}
        if action == 'update':
            return {'url': blobstore.create_upload_url('/API/timeline/update')}
        raise InvalidUsage('invalid request')


class SearchPlace(Resource):

    def get(self, place):
        params = {'key': flask_project_config.MAPS_KEY, 'input': place}
        r = requests.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', params=params)
        result = r.json()
        hints = []
        for prediction in result['predictions']:
            hints.append({
                'hint': prediction['description'],
                'key': prediction['place_id']
              })
        return jsonify(hints)


api.add_resource(CreateUser, '/API/user/signup')
api.add_resource(LoginUser, '/API/user/signin')
api.add_resource(LoadUser, '/API/user/auth')
api.add_resource(LogoutUser, '/API/user/logout')
api.add_resource(CreateTimeline, '/API/timeline/create')
api.add_resource(MakeTimelinePublic, '/API/timeline/publish')
api.add_resource(UpdateTimeline, '/API/timeline/update')
api.add_resource(LoadTimeline, '/API/timeline/load/<string:timeline_hash>')
api.add_resource(LoadTimelines, '/API/timelines/load')
api.add_resource(GetBlobEntry, '/API/blob/action/<string:action>')
api.add_resource(SearchPlace, '/API/place/search/<string:place>')

