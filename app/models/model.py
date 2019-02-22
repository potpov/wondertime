from google.appengine.ext import ndb
import datetime
import jwt
import re
import pbkdf2
import app.flask_project_config as config
from app.exceptions import InvalidUsage

CARD_OPTIONS = ('video', 'picture', 'caption', 'gallery')


class User(ndb.Model):
    username = ndb.StringProperty()
    password = ndb.StringProperty()
    email = ndb.StringProperty()
    registered_on = ndb.DateTimeProperty(auto_now_add=True)

    def encode_auth_token(self):
        """
        Generates the Auth Token
        :return: string
        """
        try:
            payload = {
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=0, hours=8),
                'iat': datetime.datetime.utcnow(),
                'sub': self.username
            }
            return jwt.encode(
                payload,
                config.SECRET_KEY,
                algorithm='HS256'
            )
        except Exception as e:
            return e

    @staticmethod
    def decode_auth_token(auth_token):
        """
        Validates the auth token
        :param auth_token:
        :return: Json Object {username} | {error}
        """
        try:
            payload = jwt.decode(auth_token, config.SECRET_KEY)
            blacklisted = Blacklist.query(Blacklist.token == auth_token).get()
            if blacklisted:
                raise InvalidUsage('This token is not valid anymore')
            return {'username': payload['sub']}
        except jwt.ExpiredSignatureError:
            raise InvalidUsage('Signature expired. Please log in again')
        except jwt.InvalidTokenError:
            raise InvalidUsage('Invalid token. Please log in again')

    @staticmethod
    def validate_new_email(email):
        """
        Check if email is valid and not already registered
        :param email:
        :return: Bool
        """
        if not re.match(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", email):
            return False
        else:
            return User.query(User.email == email).count() == 0

    @staticmethod
    def create_new_user(username, email, password):
        """
        Add a new user
        :param username:
        :param email:
        :param password:
        :return: Json Object {username, token}| {error}
        """
        if not User.validate_new_email(email):
            raise InvalidUsage('email already exists or not valid')
        if User.get_by_id(username) is not None:
            raise InvalidUsage('username already exists')

        key = ndb.Key(User, username)
        new_user = User(
            key=key,
            username=username,
            email=email,
            password=pbkdf2.crypt(password, iterations=config.CRYPT_LOG_ROUNDS)
        )
        new_user.put()
        token = new_user.encode_auth_token()
        return {
            'username': username,
            'token': token
        }

    @staticmethod
    def login_user(username, password):
        """
        Login user
        :param username:
        :param password:
        :return: Json Object {username, token} | {error}
        """

        if not username or not password:
            raise InvalidUsage('missing required parameters')

        user = ndb.Key(User, username).get()
        if not user:
            raise InvalidUsage('user does not exist, sign in now!')
        if user.password != pbkdf2.crypt(password, user.password, iterations=config.CRYPT_LOG_ROUNDS):
            raise InvalidUsage('wrong password')

        token = user.encode_auth_token()
        return {
            'username': user.username,
            'token': token
        }

    @staticmethod
    def load_user_by_token(token):
        """
        load an user from its token
        :param token:
        :return: User object | {error}
        """
        token = User.decode_auth_token(token)
        user = User.get_by_id(token['username'])
        if user is not None:
            return user
        raise InvalidUsage('this user does not exist anymore')


class Timeline(ndb.Model):
    # set user as parent when creating a new entity here
    # hash value is key id
    creation_date = ndb.DateProperty(auto_now_add=True)
    title = ndb.StringProperty()
    is_public = ndb.BooleanProperty(default=False)
    cover_url = ndb.BlobKeyProperty()
    active = ndb.BooleanProperty(default=True)

    @staticmethod
    def load_timeline(entity_key):
        """
        load a timeline by its key
        :param entity_key:
        :return: timeline entity | {error}
        """
        try:
            timeline = ndb.Key(urlsafe=entity_key).get()
        except TypeError:
            return {'error': 'problem with this timeline. sure this link is valid?'}
        if not timeline:
            raise InvalidUsage('timeline does not exist')
        if not timeline.active:
            raise InvalidUsage('timeline does not exist anymore')
        return timeline


class Blacklist(ndb.Model):
    #  just a model to save blacklisted tokens
    token = ndb.StringProperty()


class Media(ndb.Model):
    # set timeline as parent when creating a new entity here
    sequence = ndb.IntegerProperty(indexed=True)
    type = ndb.StringProperty(choices=CARD_OPTIONS)
    caption = ndb.StringProperty()
    location = ndb.GeoPtProperty()
    active = ndb.BooleanProperty(default=True)


class File(ndb.Model):
    # set Media as parent when creating a new entity here
    blob_url = ndb.BlobKeyProperty()
