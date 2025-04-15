# Generated by Django 4.2.20 on 2025-04-07 10:56

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("forum", "0002_category_tag"),
    ]

    operations = [
        migrations.CreateModel(
            name="Topic",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=255, verbose_name="Başlık")),
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True, verbose_name="Oluşturulma Tarihi"
                    ),
                ),
                (
                    "last_activity_at",
                    models.DateTimeField(
                        auto_now_add=True,
                        db_index=True,
                        verbose_name="Son Aktivite Zamanı",
                    ),
                ),
                (
                    "is_locked",
                    models.BooleanField(default=False, verbose_name="Kilitli Mi?"),
                ),
                (
                    "author",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="topics",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Yazar",
                    ),
                ),
                (
                    "category",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="topics",
                        to="forum.category",
                        verbose_name="Kategori",
                    ),
                ),
                (
                    "tags",
                    models.ManyToManyField(
                        blank=True,
                        related_name="topics",
                        to="forum.tag",
                        verbose_name="Etiketler",
                    ),
                ),
            ],
            options={
                "verbose_name": "Konu",
                "verbose_name_plural": "Konular",
                "ordering": ["-last_activity_at"],
            },
        ),
    ]
