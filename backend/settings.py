"""
Django settings for backend project.
... (django comments) ...
"""
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-=#bu+g3a^z*w$v3!#*+l9n$p8@qbq@b$v^d-2%+0&z5m*h@u%s')
DEBUG = True
ALLOWED_HOSTS = []

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin', 'django.contrib.auth', 'django.contrib.contenttypes',
    'django.contrib.sessions', 'django.contrib.messages', 'django.contrib.staticfiles',
    'rest_framework', 'rest_framework.authtoken', 'forum',
]
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware', 'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware', 'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware', 'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
ROOT_URLCONF = 'backend.urls'
TEMPLATES = [ { 'BACKEND': 'django.template.backends.django.DjangoTemplates', 'DIRS': [], 'APP_DIRS': True, 'OPTIONS': { 'context_processors': [ 'django.template.context_processors.debug', 'django.template.context_processors.request', 'django.contrib.auth.context_processors.auth', 'django.contrib.messages.context_processors.messages', ], }, }, ]
WSGI_APPLICATION = 'backend.wsgi.application'

# Database
DATABASES = { 'default': { 'ENGINE': 'django.db.backends.postgresql', 'NAME': 'okulaileforumdb', 'USER': 'vscode', 'PASSWORD': 'password', 'HOST': 'localhost', 'PORT': '5432', } }

# Password validation
AUTH_PASSWORD_VALIDATORS = [ {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',}, {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',}, {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',}, {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',}, ]

# Internationalization
LANGUAGE_CODE = 'tr-tr'; TIME_ZONE = 'Europe/Istanbul'; USE_I18N = True; USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework Settings
REST_FRAMEWORK = { 'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework.authentication.TokenAuthentication', 'rest_framework.authentication.SessionAuthentication',], 'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticatedOrReadOnly',] }

# --- YENİ: Medya dosyaları (Kullanıcı tarafından yüklenen dosyalar) ---
# https://docs.djangoproject.com/en/4.2/topics/files/
# Medya dosyalarına erişilecek temel URL (sonuna / koymak önemlidir)
MEDIA_URL = '/media/'
# Yüklenen dosyaların sunucuda fiziksel olarak saklanacağı klasörün tam yolu
# BASE_DIR proje kök dizinidir. Dosyaları proje içinde 'mediafiles' adında bir klasörde tutacağız.
MEDIA_ROOT = BASE_DIR / 'mediafiles'