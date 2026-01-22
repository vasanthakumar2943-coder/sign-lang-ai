from django.db import models
from django.contrib.auth.models import User

# ===============================
# SIGN MODEL (FIXED - SAFE)
# ===============================
class Sign(models.Model):
    name = models.CharField(max_length=50, unique=True)

    thumb = models.BooleanField(default=False)
    index = models.BooleanField(default=False)
    middle = models.BooleanField(default=False)
    ring = models.BooleanField(default=False)
    pinky = models.BooleanField(default=False)

    def __str__(self):
        return self.name


# ===============================
# TRANSLATION MODEL (UNCHANGED)
# ===============================
class Translation(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    input_type = models.CharField(max_length=10)
    input_value = models.TextField()
    output_value = models.TextField()
    confidence = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.input_type} → {self.output_value}"
