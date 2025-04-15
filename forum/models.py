from django.db import models
from django.contrib.auth.models import User # Import Django's built-in User model
from django.utils.text import slugify # To automatically create slugs
from django.utils import timezone # For default timestamps
import os # For upload_to path generation

# Imports for GenericForeignKey [Ref: 68, 71]
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

# Create your models here.

def attachment_upload_path(instance, filename):
    uploader_username = instance.uploader.username if instance.uploader else 'deleted_user'
    return f'attachments/{uploader_username}/{filename}'

class UserProfile(models.Model):
    """ UserProfile Model [Ref: 34-38] """
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True) #[Ref: 35]
    phone_number = models.CharField(
        verbose_name="Veli Telefon Numarası", # ETİKET GÜNCELLENDİ
        max_length=20,
        blank=False,
        null=False
    ) #[Ref: 36]
    student_full_name = models.CharField(verbose_name="Öğrenci Adı Soyadı", max_length=255, blank=False, null=False) #[Ref: 36]
    school_name = models.CharField(verbose_name="Okul Adı", max_length=255, blank=False, null=False) #[Ref: 37]
    is_approved = models.BooleanField(verbose_name="Onay Durumu", default=False) #[Ref: 37]
    notification_preferences = models.JSONField(verbose_name="Bildirim Tercihleri", default=dict, blank=True) #[Ref: 38]

    def __str__(self): return self.user.username
    class Meta: verbose_name = "Kullanıcı Profili"; verbose_name_plural = "Kullanıcı Profilleri"

class Category(models.Model):
    """ Category Model [Ref: 39-41] """
    name = models.CharField(verbose_name="Kategori Adı", max_length=100, unique=True, blank=False, null=False) #[Ref: 39]
    slug = models.SlugField(verbose_name="URL Uzantısı (Slug)", max_length=120, unique=True, blank=True) #[Ref: 39]
    description = models.TextField(verbose_name="Açıklama", blank=True, null=True) #[Ref: 40]
    created_at = models.DateTimeField(verbose_name="Oluşturulma Tarihi", auto_now_add=True) #[Ref: 40]
    updated_at = models.DateTimeField(verbose_name="Güncellenme Tarihi", auto_now=True) #[Ref: 40]

    def save(self, *args, **kwargs):
        if not self.slug: self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    def __str__(self): return self.name
    class Meta: verbose_name = "Kategori"; verbose_name_plural = "Kategoriler"; ordering = ['name']

class Tag(models.Model):
    """ Tag Model [Ref: 41-42] """
    name = models.CharField(verbose_name="Etiket Adı", max_length=50, unique=True, blank=False, null=False) #[Ref: 41]
    slug = models.SlugField(verbose_name="URL Uzantısı (Slug)", max_length=60, unique=True, blank=True) #[Ref: 42]

    def save(self, *args, **kwargs):
        if not self.slug: self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    def __str__(self): return self.name
    class Meta: verbose_name = "Etiket"; verbose_name_plural = "Etiketler"; ordering = ['name']

class Topic(models.Model):
    """ Topic Model [Ref: 43-49] """
    title = models.CharField(verbose_name="Başlık", max_length=255, blank=False, null=False) #[Ref: 43]
    author = models.ForeignKey(User, verbose_name="Yazar", on_delete=models.SET_NULL, null=True, related_name='topics') #[Ref: 44]
    category = models.ForeignKey(Category, verbose_name="Kategori", on_delete=models.SET_NULL, null=True, blank=True, related_name='topics') #[Ref: 45]
    tags = models.ManyToManyField(Tag, verbose_name="Etiketler", blank=True, related_name='topics') #[Ref: 46]
    created_at = models.DateTimeField(verbose_name="Oluşturulma Tarihi", auto_now_add=True) #[Ref: 47]
    last_activity_at = models.DateTimeField(verbose_name="Son Aktivite Zamanı", auto_now_add=True, db_index=True) #[Ref: 47]
    is_locked = models.BooleanField(verbose_name="Kilitli Mi?", default=False) #[Ref: 48]

    def __str__(self): return self.title
    class Meta: verbose_name = "Konu"; verbose_name_plural = "Konular"; ordering = ['-last_activity_at']

class Post(models.Model):
    """ Post Model [Ref: 50-56] """
    topic = models.ForeignKey(Topic, verbose_name="Konu", on_delete=models.CASCADE, related_name='posts') #[Ref: 51]
    author = models.ForeignKey(User, verbose_name="Yazar", on_delete=models.SET_NULL, null=True, related_name='posts') #[Ref: 52]
    content = models.TextField(verbose_name="İçerik") #[Ref: 53]
    created_at = models.DateTimeField(verbose_name="Oluşturulma Tarihi", auto_now_add=True) #[Ref: 54]
    updated_at = models.DateTimeField(verbose_name="Güncellenme Tarihi", auto_now=True) #[Ref: 55]
    is_first_post = models.BooleanField(verbose_name="İlk Mesaj Mı?", default=False) #[Ref: 56]

    def __str__(self): return f"Mesaj: {self.content[:50]}..."
    class Meta: verbose_name = "Mesaj"; verbose_name_plural = "Mesajlar"; ordering = ['created_at']

class Attachment(models.Model):
    """ Attachment Model [Ref: 56-64] """
    file = models.FileField(verbose_name="Dosya", upload_to=attachment_upload_path) #[Ref: 57]
    uploader = models.ForeignKey(User, verbose_name="Yükleyen", on_delete=models.SET_NULL, null=True, related_name='attachments') #[Ref: 58]
    post = models.ForeignKey(Post, verbose_name="İlişkili Mesaj", on_delete=models.CASCADE, null=True, blank=True, related_name='attachments') #[Ref: 59]
    is_general = models.BooleanField(verbose_name="Genel Dosya Mı?", default=False) #[Ref: 61]
    original_filename = models.CharField(verbose_name="Orijinal Dosya Adı", max_length=255, blank=True) #[Ref: 62]
    file_size = models.PositiveIntegerField(verbose_name="Dosya Boyutu (byte)", null=True, blank=True) #[Ref: 62]
    mime_type = models.CharField(verbose_name="Dosya Türü (MIME)", max_length=100, blank=True) #[Ref: 62]
    uploaded_at = models.DateTimeField(verbose_name="Yüklenme Tarihi", auto_now_add=True) #[Ref: 63]
    description = models.CharField(verbose_name="Açıklama", max_length=255, blank=True) #[Ref: 64]

    def save(self, *args, **kwargs):
        if not self.original_filename and self.file: self.original_filename = os.path.basename(self.file.name)
        if not self.file_size and self.file:
             try: self.file_size = self.file.size
             except Exception: pass
        super().save(*args, **kwargs)
    def __str__(self): return self.original_filename or os.path.basename(str(self.file.name))
    class Meta: verbose_name = "Dosya Eki"; verbose_name_plural = "Dosya Ekleri"; ordering = ['-uploaded_at']


class Notification(models.Model):
    """ Notification Model [Ref: 64-69] """
    recipient = models.ForeignKey(User, verbose_name="Alıcı", on_delete=models.CASCADE, related_name='notifications') #[Ref: 65]
    actor = models.ForeignKey(User, verbose_name="Etken", on_delete=models.SET_NULL, null=True, related_name='acted_notifications') #[Ref: 66]
    verb = models.CharField(verbose_name="Eylem", max_length=255) #[Ref: 67]
    target_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True, related_name='notification_target') #[Ref: 68]
    target_object_id = models.PositiveIntegerField(null=True, blank=True)
    target = GenericForeignKey('target_content_type', 'target_object_id')
    action_object_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True, related_name='notification_action')
    action_object_object_id = models.PositiveIntegerField(null=True, blank=True)
    action_object = GenericForeignKey('action_object_content_type', 'action_object_object_id')
    is_read = models.BooleanField(verbose_name="Okundu Mu?", default=False, db_index=True) #[Ref: 68]
    created_at = models.DateTimeField(verbose_name="Oluşturulma Tarihi", auto_now_add=True, db_index=True) #[Ref: 69]

    def __str__(self):
        if self.target: return f"{self.actor} {self.verb} {self.target}"
        elif self.action_object: return f"{self.actor} {self.verb} on {self.action_object}"
        else: return f"{self.actor} {self.verb}"
    class Meta: verbose_name = "Bildirim"; verbose_name_plural = "Bildirimler"; ordering = ['-created_at']


class ReportedContent(models.Model):
    """ ReportedContent Model [Ref: 69-75] """
    REPORT_STATUS_CHOICES = [('yeni', 'Yeni'), ('incelendi', 'İncelendi'), ('reddedildi', 'Reddedildi')] #[Ref: 73]
    reporter = models.ForeignKey(User, verbose_name="Raporlayan", on_delete=models.SET_NULL, null=True, related_name='reported_items') #[Ref: 70]
    content_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE) #[Ref: 71]
    content_object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_content_type', 'content_object_id')
    reason = models.TextField(verbose_name="Raporlama Sebebi", blank=True) #[Ref: 72]
    status = models.CharField(verbose_name="Durum", max_length=10, choices=REPORT_STATUS_CHOICES, default='yeni', db_index=True) #[Ref: 73]
    reported_at = models.DateTimeField(verbose_name="Raporlama Zamanı", auto_now_add=True) #[Ref: 74]
    resolved_at = models.DateTimeField(verbose_name="Çözülme Zamanı", null=True, blank=True) #[Ref: 74]
    resolver = models.ForeignKey(User, verbose_name="Çözen Yönetici", on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_reports') #[Ref: 75]

    def __str__(self): return f"Rapor: {self.content_object} (Durum: {self.get_status_display()})"
    class Meta: verbose_name = "Rapor Edilen İçerik"; verbose_name_plural = "Rapor Edilen İçerikler"; ordering = ['-reported_at']


class TopicFollow(models.Model):
    """ TopicFollow Model [Ref: 75-79] """
    user = models.ForeignKey(User, verbose_name="Takip Eden Kullanıcı", on_delete=models.CASCADE, related_name='followed_topics') #[Ref: 76]
    topic = models.ForeignKey(Topic, verbose_name="Takip Edilen Konu", on_delete=models.CASCADE, related_name='followers') #[Ref: 77]
    followed_at = models.DateTimeField(verbose_name="Takip Başlama Zamanı", auto_now_add=True) #[Ref: 78]

    def __str__(self): return f"{self.user.username} takip ediyor: {self.topic.title}"
    class Meta:
        verbose_name = "Konu Takibi"; verbose_name_plural = "Konu Takipleri"
        constraints = [models.UniqueConstraint(fields=['user', 'topic'], name='unique_user_topic_follow')] #[Ref: 79]
        ordering = ['-followed_at']