# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from . import __version__ as app_version

app_name = "fikrah"
app_title = "Fikrah"
app_publisher = "NAhedh"
app_description = "فكرة جميلة"
app_icon = "octicon octicon-file-directory"
app_color = "red"
app_email = "info@nahedh.com"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/fikrah/css/fikrah.css"
# app_include_js = "/assets/fikrah/admin_ui.js"
ui_production = True
if ui_production:
    app_include_js = [
        "/assets/desk-new-ui.js"
    ]
    app_include_css = [
        "/assets/desk-new-ui.css"
    ]
else:
    app_include_js = [
        "/assets/desk-new-ui-html.js",
        "/assets/fikrah/admin_ui/main.js"
    ]
    app_include_css = [
        "/assets/fikrah/admin_ui/bower_components/angular-material/angular-material.min.css",
        "/assets/fikrah/admin_ui/style.css"
    ]

# include js, css files in header of web template
# web_include_css = "/assets/fikrah/css/fikrah.css"
# web_include_js = "/assets/fikrah/js/fikrah.js"

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Website user home page (by function)
# get_website_user_home_page = "fikrah.utils.get_home_page"

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "fikrah.install.before_install"
# after_install = "fikrah.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "fikrah.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"fikrah.tasks.all"
# 	],
# 	"daily": [
# 		"fikrah.tasks.daily"
# 	],
# 	"hourly": [
# 		"fikrah.tasks.hourly"
# 	],
# 	"weekly": [
# 		"fikrah.tasks.weekly"
# 	]
# 	"monthly": [
# 		"fikrah.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "fikrah.install.before_tests"

# Overriding Whitelisted Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "fikrah.event.get_events"
# }
