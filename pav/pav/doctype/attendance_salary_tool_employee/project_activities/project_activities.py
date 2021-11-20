# -*- coding: utf-8 -*-
# Copyright (c) 2019, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt


import json

import frappe
from frappe import _, throw
from frappe.utils import add_days, cstr, date_diff, get_link_to_form, getdate
from frappe.utils.nestedset import NestedSet
from frappe.desk.form.assign_to import close_all_assignments, clear
from frappe.utils import date_diff

class CircularReferenceError(frappe.ValidationError): pass
class EndDateCannotBeGreaterThanProjectEndDateError(frappe.ValidationError): pass

class ProjectActivities(NestedSet):
	nsm_parent_field = 'parent_project_activities'

def populate_depends_on(self):
		if self.parent_project_activities:
			parent = frappe.get_doc('Project Activities', self.parent_project_activities)
			if not self.name in [row.project_activities for row in parent.depends_on]:
				parent.append("depends_on", {
					"doctype": "Project Activities Depends On",
					"project_activities": self.name,
					"subject": self.subject
				})
				parent.save()

@frappe.whitelist()
def check_if_child_exists(name):
	child_tasks = frappe.get_all("Project Activities", filters={"parent_project_activities": name})
	child_tasks = [get_link_to_form("Project Activities", project_activities.name) for project_activities in child_tasks]
	return child_tasks


 
@frappe.whitelist()
def get_children(doctype, parent, project_activities=None, project=None, is_root=False):

	filters = [['docstatus', '<', '2']]

	if project_activities:
		filters.append(['parent_project_activities', '=', project_activities])
	elif parent and not is_root:
		# via expand child
		filters.append(['parent_project_activities', '=', parent])
	else:
		filters.append(['ifnull(`parent_project_activities`, "")', '=', ''])

	if project:
		filters.append(['project', '=', project])

	activities = frappe.get_list(doctype, fields=[
		'name as value',
		'project_activity as title',
		'is_group as expandable'
	], filters=filters, order_by='name')

	# return activities
	return activities

@frappe.whitelist()
def add_node():
	from frappe.desk.treeview import make_tree_args
	args = frappe.form_dict
	args.update({
		"name_field": "project_activity"
	})
	args = make_tree_args(**args)

	if args.parent_project_activities == 'All Project Activities' or args.parent_project_activities == args.project:
		args.parent_project_activities = None

	frappe.get_doc(args).insert()

@frappe.whitelist()
def add_multiple_project_activities(data, parent):
	data = json.loads(data)
	new_doc = {'doctype': 'Project Activities', 'parent_project_activities': parent if parent!="All Project Activities" else ""}
	new_doc['project'] = frappe.db.get_value('Project Activities', {"name": parent}, 'project') or ""

	for d in data:
		if not d.get("project_activity"): continue
		new_doc['project_activity'] = d.get("project_activity")
		new_project_activities = frappe.get_doc(new_doc)
		new_project_activities.insert()

