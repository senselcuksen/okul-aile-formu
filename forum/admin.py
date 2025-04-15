from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import (
    UserProfile, Category, Tag, Topic, Post, Attachment,
    Notification, ReportedContent, TopicFollow
)

# --- Admin Customization Classes ---
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at', 'updated_at'); search_fields = ('name', 'description'); list_filter = ('created_at', 'updated_at'); prepopulated_fields = {'slug': ('name',)}
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug'); search_fields = ('name',); prepopulated_fields = {'slug': ('name',)}
class TopicAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'category', 'created_at', 'last_activity_at', 'is_locked'); search_fields = ('title', 'author__username'); list_filter = ('category', 'created_at', 'last_activity_at', 'is_locked')
class UserProfileInline(admin.StackedInline):
    model = UserProfile; can_delete = False; verbose_name_plural = 'Veli Profil Bilgileri'; fk_name = 'user'; fields = ('phone_number', 'student_full_name', 'school_name', 'is_approved', 'notification_preferences')

class CustomUserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    # 'is_active' sütununu listeye ekledik
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_active', 'get_is_approved', 'is_staff') # <-- is_active EKLENDİ
    list_select_related = ('userprofile',)
    @admin.display(boolean=True, description='Profil Onaylı Mı?')
    def get_is_approved(self, instance):
        try: return instance.userprofile.is_approved
        except UserProfile.DoesNotExist: return False
    # Filtrelere 'is_active' de eklendi
    list_filter = BaseUserAdmin.list_filter + ('is_active', 'userprofile__is_approved',) # <-- is_active EKLENDİ

# --- Register Models ---
admin.site.register(Category, CategoryAdmin)
admin.site.register(Tag, TagAdmin)
admin.site.register(Topic, TopicAdmin)
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
# admin.site.register(UserProfile) # Inline olduğu için gereksiz
admin.site.register(Post)
admin.site.register(Attachment)
admin.site.register(Notification)
admin.site.register(ReportedContent)
admin.site.register(TopicFollow)