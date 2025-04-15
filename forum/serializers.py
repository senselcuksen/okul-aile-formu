from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
# Import ContentType for GenericForeignKey handling
from django.contrib.contenttypes.models import ContentType
# Import ALL models needed
from .models import (
    Category, Tag, Topic, UserProfile, Post, Attachment, Notification,
    ReportedContent, TopicFollow # Import ReportedContent
)
import os # Needed for Attachment path manipulation

def attachment_upload_path(instance, filename):
    uploader_username = instance.uploader.username if instance.uploader else 'deleted_user'
    return f'attachments/{uploader_username}/{filename}'

# --- Serializers ---

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'created_at')

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ('id', 'name', 'slug')

class TopicListSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    category = serializers.StringRelatedField(read_only=True)
    tags = serializers.StringRelatedField(many=True, read_only=True)
    class Meta:
        model = Topic
        fields = ('id','title','author','category','tags','created_at','last_activity_at','is_locked')

class UserRegistrationSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(write_only=True, required=True)
    student_full_name = serializers.CharField(write_only=True, required=True)
    school_name = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ('email', 'password', 'first_name', 'last_name',
                  'phone_number', 'student_full_name', 'school_name')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True}
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Bu e-posta adresi zaten kullanılıyor.")
        return value

    def create(self, validated_data):
        profile_data = {
            'phone_number': validated_data.pop('phone_number'),
            'student_full_name': validated_data.pop('student_full_name'),
            'school_name': validated_data.pop('school_name')
        }
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_active=False
        )
        UserProfile.objects.create(user=user, **profile_data, is_approved=False)
        return user

class TopicCreateSerializer(serializers.ModelSerializer):
    post_content = serializers.CharField(write_only=True, required=True, label="İlk Mesaj İçeriği")
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False, allow_null=True)
    tags = serializers.PrimaryKeyRelatedField(queryset=Tag.objects.all(), many=True, required=False)

    class Meta:
        model = Topic
        fields = ('id', 'title', 'category', 'tags', 'post_content', 'author', 'created_at', 'last_activity_at')
        read_only_fields = ('id', 'author', 'created_at', 'last_activity_at')

    def create(self, validated_data):
        post_content = validated_data.pop('post_content')
        tags_data = validated_data.pop('tags', None)
        topic = Topic.objects.create(**validated_data)
        if tags_data:
            topic.tags.set(tags_data)
        Post.objects.create(topic=topic, author=topic.author, content=post_content, is_first_post=True)
        return topic

class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    author_id = serializers.ReadOnlyField(source='author.id')

    class Meta:
        model = Post
        fields = ('id', 'author', 'author_id', 'content', 'created_at', 'updated_at')

class TopicDetailSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    category = serializers.StringRelatedField(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    posts = PostSerializer(many=True, read_only=True)
    is_followed = serializers.SerializerMethodField()

    class Meta:
        model = Topic
        fields = ('id','title','author','category','tags','created_at','last_activity_at','is_locked','posts','is_followed')

    def get_is_followed(self, obj):
        request = self.context.get('request', None)
        if request is None or not request.user.is_authenticated: return False
        return TopicFollow.objects.filter(topic=obj, user=request.user).exists()

class PostCreateSerializer(serializers.ModelSerializer):
    class Meta: model = Post; fields = ('content',)

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta: model = UserProfile; fields = ('phone_number', 'student_full_name', 'school_name', 'is_approved', 'notification_preferences')

class UserDetailSerializer(serializers.ModelSerializer):
    userprofile = UserProfileSerializer(read_only=True)
    class Meta: model = User; fields = ('id', 'username', 'email', 'first_name', 'last_name', 'userprofile')

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta: model = UserProfile; fields = ('notification_preferences',)

class AttachmentSerializer(serializers.ModelSerializer):
    uploader = serializers.StringRelatedField(read_only=True); file_url = serializers.SerializerMethodField(); post = serializers.PrimaryKeyRelatedField(queryset=Post.objects.all(), required=False, allow_null=True, write_only=True)
    class Meta: model=Attachment; fields=('id','file','file_url','uploader','post','is_general','original_filename','file_size','mime_type','uploaded_at','description'); read_only_fields=('id','uploader','original_filename','file_size','mime_type','uploaded_at','file_url')
    def get_file_url(self, obj): request=self.context.get('request'); return request.build_absolute_uri(obj.file.url) if obj.file and request else None

# --- Reported Content Serializer (validate metodu DÜZELTİLDİ) ---
class ReportedContentSerializer(serializers.ModelSerializer):
    content_type_app_label = serializers.CharField(write_only=True, required=True)
    content_type_model = serializers.CharField(write_only=True, required=True)
    object_id = serializers.IntegerField(write_only=True, required=True)
    reason = serializers.CharField(required=False, allow_blank=True, style={'base_template': 'textarea.html'})
    reporter = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = ReportedContent
        fields = ('id', 'reporter', 'reason', 'status', 'reported_at',
                  'content_type_app_label', 'content_type_model', 'object_id')
        read_only_fields = ('id', 'reporter', 'status', 'reported_at')

    def validate(self, data):
        """ Validate that the content_type and object_id point to a valid object. """
        app_label = data.get('content_type_app_label')
        model_name = data.get('content_type_model')
        object_id = data.get('object_id')

        # Ensure required fields are present
        if not (app_label and model_name and object_id is not None): # Check object_id for None too
             raise serializers.ValidationError("content_type_app_label, content_type_model, and object_id are required.")

        # Check if content type is valid
        try:
            content_type = ContentType.objects.get(app_label=app_label, model=model_name)
        except ContentType.DoesNotExist:
            raise serializers.ValidationError(f"Geçersiz içerik türü: {app_label}.{model_name}")

        # Check if the model class exists
        model_class = content_type.model_class()
        if model_class is None:
             raise serializers.ValidationError(f"İçerik türü için model bulunamadı: {app_label}.{model_name}")

        # Check if the object itself exists (Removed invalid backslashes)
        if not model_class.objects.filter(pk=object_id).exists():
            raise serializers.ValidationError(f"{model_class.__name__} ID {object_id} ile bulunamadı.")

        return data

    def create(self, validated_data):
        """ Create the ReportedContent instance using CORRECT field names. """
        reporter = self.context['request'].user
        app_label = validated_data.get('content_type_app_label')
        model_name = validated_data.get('content_type_model')
        object_id_val = validated_data.get('object_id')
        reason = validated_data.get('reason', '')
        content_type_obj = ContentType.objects.get(app_label=app_label, model=model_name)
        # Use correct field names: content_content_type, content_object_id
        report = ReportedContent.objects.create(
            reporter=reporter,
            content_content_type=content_type_obj,
            content_object_id=object_id_val,
            reason=reason
        )
        return report

# --- End of Serializers ---