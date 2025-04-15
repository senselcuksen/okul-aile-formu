from django.urls import path
from . import views # Import views from the current app
# Import DRF's built-in view for obtaining auth tokens
from rest_framework.authtoken.views import obtain_auth_token

app_name = 'forum' # Namespace for the app's URLs

urlpatterns = [
    # Category URLs
    path('categories/', views.CategoryListAPIView.as_view(), name='category-list'),

    # Tag URLs
    path('tags/', views.TagListAPIView.as_view(), name='tag-list'),

    # Topic URLs
    path('topics/', views.TopicListCreateAPIView.as_view(), name='topic-list'),
    path('topics/<int:pk>/', views.TopicRetrieveAPIView.as_view(), name='topic-detail'),
    path('topics/<int:topic_pk>/follow/', views.TopicFollowToggleAPIView.as_view(), name='topic-follow-toggle'),

    # Post URLs
    path('topics/<int:topic_pk>/posts/', views.PostCreateAPIView.as_view(), name='post-create'),
    path('posts/<int:pk>/', views.PostRetrieveUpdateDestroyAPIView.as_view(), name='post-detail'),

    # Attachment URLs
    path('attachments/', views.AttachmentCreateAPIView.as_view(), name='attachment-create'),
    path('attachments/general/', views.GeneralAttachmentListAPIView.as_view(), name='attachment-general-list'),
    path('attachments/<int:pk>/', views.AttachmentDestroyAPIView.as_view(), name='attachment-detail'),

    # User URLs
    path('users/me/', views.UserProfileAPIView.as_view(), name='user-me'),

    # Search URL
    path('search/', views.SearchView.as_view(), name='search'),

    # Reporting URL <<< BU SATIRIN OLDUĞUNDAN EMİN OLUN
    path('report/', views.ReportedContentCreateAPIView.as_view(), name='content-report'), # [Ref: 135]

    # Authentication URLs
    path('auth/register/', views.UserRegistrationAPIView.as_view(), name='register'),
    path('auth/login/', obtain_auth_token, name='login'),

]