from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth.models import User
# Import Q object for complex lookups
from django.db.models import Q
# Import ContentType
from django.contrib.contenttypes.models import ContentType

from rest_framework.generics import (
    ListAPIView, CreateAPIView, ListCreateAPIView, RetrieveAPIView,
    RetrieveUpdateAPIView, RetrieveUpdateDestroyAPIView, DestroyAPIView
)
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

# Import models
from .models import (
    Category, Tag, Topic, Post, UserProfile, TopicFollow, Attachment,
    ReportedContent # Import ReportedContent
)
# Import serializers
from .serializers import (
    CategorySerializer, TagSerializer, TopicListSerializer, UserDetailSerializer,
    UserRegistrationSerializer, TopicCreateSerializer, PostSerializer,
    TopicDetailSerializer, PostCreateSerializer, UserProfileSerializer,
    UserProfileUpdateSerializer, AttachmentSerializer, ReportedContentSerializer # Import ReportedContentSerializer
)
# Import custom permissions
from .permissions import IsOwnerWithin1HourOrAdmin, IsOwnerOrAdmin, IsApprovedUser

# --- Views (Correctly Formatted) ---

class CategoryListAPIView(ListAPIView):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

class TagListAPIView(ListAPIView):
    queryset = Tag.objects.all().order_by('name')
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

class TopicListCreateAPIView(ListCreateAPIView):
    queryset = Topic.objects.select_related('author', 'category').prefetch_related('tags').all()
    permission_classes = [IsAuthenticated, IsApprovedUser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TopicCreateSerializer
        return TopicListSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class UserRegistrationAPIView(CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

class TopicRetrieveAPIView(RetrieveAPIView):
    queryset = Topic.objects.select_related('author', 'category').prefetch_related('tags', 'posts__author').all()
    serializer_class = TopicDetailSerializer
    permission_classes = [IsAuthenticated]

class PostCreateAPIView(CreateAPIView):
    serializer_class = PostCreateSerializer
    permission_classes = [IsAuthenticated, IsApprovedUser]

    def perform_create(self, serializer):
        topic = get_object_or_404(Topic, pk=self.kwargs.get('topic_pk'))
        if topic.is_locked:
            raise PermissionDenied("Bu konu yorumlara kilitlenmiştir.")
        post = serializer.save(author=self.request.user, topic=topic)
        topic.last_activity_at = post.created_at
        topic.save(update_fields=['last_activity_at'])

class UserProfileAPIView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserDetailSerializer # Use UserDetailSerializer for GET

    def get_object(self):
        # Return User object
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer # Use profile serializer for update
        return self.serializer_class # Use UserDetailSerializer for GET

    def perform_update(self, serializer):
        # Get the profile instance to update
        try:
            profile_instance = self.request.user.userprofile
            serializer.save(instance=profile_instance)
        except UserProfile.DoesNotExist:
             raise NotFound("Güncellenecek kullanıcı profili bulunamadı.")

class TopicFollowToggleAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, topic_pk=None):
        topic = get_object_or_404(Topic, pk=topic_pk)
        user = request.user
        follow, created = TopicFollow.objects.get_or_create(user=user, topic=topic)
        if created:
            return Response({"detail": "Konu başarıyla takip edildi."}, status=status.HTTP_201_CREATED)
        else:
            return Response({"detail": "Bu konu zaten takip ediliyor."}, status=status.HTTP_200_OK)

    def delete(self, request, topic_pk=None):
        topic = get_object_or_404(Topic, pk=topic_pk)
        user = request.user
        follow = get_object_or_404(TopicFollow, user=user, topic=topic)
        follow.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class PostRetrieveUpdateDestroyAPIView(RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.select_related('author', 'topic').all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated, IsOwnerWithin1HourOrAdmin]

class AttachmentCreateAPIView(CreateAPIView):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        serializer.save(uploader=self.request.user)

class GeneralAttachmentListAPIView(ListAPIView):
    serializer_class = AttachmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Attachment.objects.filter(is_general=True).select_related('uploader').order_by('-uploaded_at')

class AttachmentDestroyAPIView(DestroyAPIView):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

class SearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({"query": query, "topics": [], "posts": [], "users": [], "attachments": []}, status=status.HTTP_200_OK)

        topic_results = Topic.objects.filter(Q(title__icontains=query)).select_related('author', 'category')[:10]
        post_results = Post.objects.filter(Q(content__icontains=query)).select_related('author', 'topic')[:10]
        user_results = User.objects.filter(Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query))[:10]
        attachment_results = Attachment.objects.filter(Q(original_filename__icontains=query) | Q(description__icontains=query)).select_related('uploader')[:10]

        topic_data = list(topic_results.values('id', 'title', 'author__username'))
        post_data = list(post_results.values('id', 'content', 'topic_id', 'author__username'))
        user_data = list(user_results.values('id', 'username', 'first_name', 'last_name'))
        attachment_data = list(attachment_results.values('id', 'original_filename', 'uploader__username'))

        data = {'query': query, 'topics': topic_data, 'posts': post_data, 'users': user_data, 'attachments': attachment_data}
        return Response(data, status=status.HTTP_200_OK)

class ReportedContentCreateAPIView(CreateAPIView):
    queryset = ReportedContent.objects.all()
    serializer_class = ReportedContentSerializer
    permission_classes = [IsAuthenticated]
    # No perform_create needed

# --- End of Views ---