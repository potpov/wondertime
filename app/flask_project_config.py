import appengine_config

if appengine_config.GAE_DEV:
    SECRET_KEY = 'sodummy'
    DEBUG = True

else:
    SECRET_KEY = 'gawfub&/4Fy271274'
    DEBUG = False

MEDIA_PUB_DIR = '/media'
CRYPT_LOG_ROUNDS = 13
MAPS_KEY = 'AIzaSyA-M96Mu_l_YKqTXsE-9BzfI1wRJFntijE'


app_params = {
    'SECRET_KEY': SECRET_KEY,
    'DEBUG': DEBUG,
    'WEBPACK_MANIFEST_PATH': '../manifest.json'
}
