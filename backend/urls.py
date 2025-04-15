"""
URL configuration for backend project.
... (django comments) ...
"""
from django.contrib import admin
from django.urls import path, include
# YENİ: Medya dosyalarını sunmak için gerekli importlar
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('forum.urls', namespace='forum_api')),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]

# YENİ: Sadece DEBUG modunda (geliştirme yaparken) medya dosyalarını sunmak için URL deseni ekle
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)