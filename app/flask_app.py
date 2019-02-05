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

webpack = Webpack()
app = Flask(__name__)
app.config.from_object(__name__)


app.config.update(flask_project_config.app_params)

csrf_protect = CSRFProtect(app)
api = Api(app, decorators=[csrf_protect.exempt])
webpack.init_app(app)

# Use the App Engine Requests adapter. This makes sure that Requests uses URLFetch.
requests_toolbelt.adapters.appengine.monkeypatch()


@app.route("{}/<bkey>".format(flask_project_config.MEDIA_PUB_DIR))
def img(bkey):
    blob_info = blobstore.get(bkey)
    response = make_response(blob_info.open().read())
    response.headers['Content-Type'] = blob_info.content_type
    return response


@app.route('/', defaults={'path': ''}, methods=['GET', 'POST'])
@app.route('/<path:path>')
def index(path):
    return render_template('index.html')


class CreateUser(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('username', type=str, required=True)
        self.parser.add_argument('password', type=str, required=True)
        self.parser.add_argument('email', type=str, required=True)

    def post(self):
        args = self.parser.parse_args()
        result = model.User.create_new_user(args.username, args.email, args.password)
        if 'error' in result:
            return jsonify(result), status.HTTP_400_BAD_REQUEST
        return jsonify(result)


class LoginUser(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('username', type=str, required=True)
        self.parser.add_argument('password', type=str, required=True)

    def post(self):
        args = self.parser.parse_args()
        result = model.User.login_user(args.username, args.password)
        if 'error' in result:
            return jsonify(result), status.HTTP_400_BAD_REQUEST
        return jsonify(result)


class LoadUser(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('Authorization', type=str, location='headers', required=True)

    def get(self):
        args = self.parser.parse_args()
        token = args.Authorization.split(" ")[1]
        result = model.User.load_user_by_token(token)
        if isinstance(result, model.User):
            return jsonify({'user': result.username})
        if 'error' in result:
            return jsonify(result), status.HTTP_403_FORBIDDEN
        return {'error', 'unknown error here'}, status.HTTP_403_FORBIDDEN


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
            return {'message': 'user logged out successfully'}, status.HTTP_204_NO_CONTENT
        return {'error': 'it is impossible to logout the user.'}, status.HTTP_400_BAD_REQUEST


class CreateTimeline(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('title', type=str, required=True)
        # self.parser.add_argument('cover', type=file, required=True)
        self.parser.add_argument('Authorization', type=str, location='headers', required=True)

    def post(self):
        args = self.parser.parse_args()
        token = args.Authorization.split(" ")[1]
        user = model.User.load_user_by_token(token)
        if isinstance(user, model.User):
            # getting blob instance
            f = request.files['cover']
            cover_header = f.headers['Content-Type']
            parsed_header = parse_options_header(cover_header)
            blob_key = parsed_header[1]['blob-key']
            # creating the timeline
            model.Timeline(
                parent=user.key,
                title=args.title,
                cover_url=blobstore.BlobKey(blob_key)
            ).put()
            return {'success': 'timeline created'}
        else:
            return user, status.HTTP_400_BAD_REQUEST  # error message here


class MakeTimelinePublic(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('timeline_hash', type=str, required=True)
        self.parser.add_argument('Authorization', type=str, location='headers', required=True)

    def post(self):
        args = self.parser.parse_args()
        token = args.Authorization.split(" ")[1]
        user = model.User.load_user_by_token(token)
        if isinstance(user, model.User):
            timeline = model.Timeline.load_timeline(entity_key=args.timeline_hash)
            if not isinstance(timeline, model.Timeline):
                return timeline, status.HTTP_400_BAD_REQUEST  # error here
            if timeline.key.parent() == user.key:  # check if the auth user is also admin for this timeline
                timeline.is_public = True
                timeline.put()
                return {'success': 'timeline is now public'},
            else:
                return {'error': 'permission denied'}, status.HTTP_400_BAD_REQUEST
        return jsonify(user)


class LoadTimeline(Resource):

    def __init__(self):
        self.parser = reqparse.RequestParser()
        self.parser.add_argument('Authorization', type=str, location='headers', required=False)

    def get(self, timeline_hash):
        if not timeline_hash:
            return {'error': 'no timeline specified'}, status.HTTP_400_BAD_REQUEST
        args = self.parser.parse_args()
        timeline = model.Timeline.load_timeline(entity_key=timeline_hash)
        if not isinstance(timeline, model.Timeline):
            return timeline  # error here

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
                return jsonify(user)  # invalid user here

        #  deny access to private timelines
        if not timeline.is_public and not is_admin:
            return {'error': 'this timeline is not public.'}, status.HTTP_400_BAD_REQUEST

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
            return timeline  # problems with timelines
        token = args.Authorization.split(" ")[1]
        user = model.User.load_user_by_token(token)
        if not isinstance(user, model.User):
            return user  # problems with user
        if timeline.key.parent() != user.key:  # problems with permissions
            return {'error', 'you dont  have permission to edit this file'}, status.HTTP_400_BAD_REQUEST
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
                media = model.Media(
                    parent=timeline.key,
                    sequence=card['sequence'],
                    type=str(card['type']),
                    caption=str(card['caption']),
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
            for result in results:
                response.append({
                    'creation_date': result.creation_date,
                    'title': result.title,
                    'cover_url': '/media/{}'.format(result.cover_url),
                    'hash': result.key.urlsafe(),
                    'isPublic': result.is_public
                })
            return jsonify(response)
        return jsonify(user)  # error message here


class GetBlobEntry(Resource):
    def get(self, action):
        if action == 'create':
            return {'url': blobstore.create_upload_url('/API/timeline/create')}
        if action == 'update':
            return {'url': blobstore.create_upload_url('/API/timeline/update')}
        return {'error': 'invalid request'}, status.HTTP_400_BAD_REQUEST


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

