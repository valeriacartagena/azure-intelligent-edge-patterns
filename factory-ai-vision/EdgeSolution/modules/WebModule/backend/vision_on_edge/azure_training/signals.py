"""
Signals
"""

import logging

from django.db.models.signals import pre_save
from django.dispatch import receiver

from ..azure_settings.models import Setting
from .models import Project

logger = logging.getLogger(__name__)


@receiver(signal=pre_save,
          sender=Setting,
          dispatch_uid="delete_project_on_setting_change")
def azure_setting_change_handler(**kwargs):
    """
    Listen on azure_settings.models.Setting Change.
    Delete project under this setting
    """
    logger.info("Azure Setting changed.")
    logger.info("Checking...")

    if 'sender' not in kwargs or kwargs['sender'] != Setting:
        logger.info("'sender' not in kwargs or kwargs['sender'] != setting")
        logger.info("nothing to do")
        return
    if 'instance' not in kwargs:
        logger.info("'instance' not in kwargs:'")
        logger.info("Nothing to do")
        return
    instance = kwargs['instance']
    if len(Setting.objects.filter(pk=instance.id)) <= 0:
        logger.info("Probably creating a new setting")
        logger.info("Nothing to do")
        return
    old_setting = Setting.objects.get(pk=instance.id)
    if old_setting.training_key == instance.training_key and \
            old_setting.endpoint == instance.endpoint:
        logger.info("Training Key and Endpoint not changed")
        logger.info("Nothing to do")
        return

    logger.info("Setting endpoint or training_key changed...")
    logger.info("Deleting all none-demo project....")
    Project.objects.filter(setting=kwargs['instance'], is_demo=False).delete()
    logger.info("Creating a none-demo project....")
    Project.objects.update_or_create(setting=kwargs['instance'], is_demo=False)
