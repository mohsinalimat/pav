// Copyright (c) 2016, Ahmed Mohammed Alkuhlani and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Accounting Dimension Balance"] = {
	"filters": [
		{
			fieldname: "company",
			label: __("Company"),
			fieldtype: "Link",
			options: "Company",
			default: frappe.defaults.get_user_default("Company"),
			reqd: 1
		},
		{
			"fieldname": "fiscal_year",
			"label": __("Fiscal Year"),
			"fieldtype": "Link",
			"options": "Fiscal Year",
			"default": frappe.defaults.get_user_default("fiscal_year"),
			"reqd": 1,
			"on_change": function (query_report) {
				var fiscal_year = query_report.get_values().fiscal_year;
				if (!fiscal_year) {
					return;
				}
				frappe.model.with_doc("Fiscal Year", fiscal_year, function (r) {
					var fy = frappe.model.get_doc("Fiscal Year", fiscal_year);
					frappe.query_report.set_filter_value({
						from_date: fy.year_start_date,
						to_date: fy.year_end_date
					});
				});
			}
		},
		{
			"fieldname": "from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"default": frappe.defaults.get_user_default("year_start_date"),
		},
		{
			"fieldname": "to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"default": frappe.defaults.get_user_default("year_end_date"),
		},
		{
			fieldname: "budget_against",
			label: __("Budget Against"),
			fieldtype: "Select",
			options: ["Cost Center", "Project"],
			default: "Cost Center",
			reqd: 1,
			on_change: function () {
				frappe.query_report.set_filter_value("budget_against_filter", []);
				frappe.query_report.refresh();				
				// let budget_against = frappe.query_report.get_filter_value('budget_against');
				// if (!budget_against) return;

				// if(budget_against == "Task"){
				// 	frappe.query_reports["Accounting Dimension Balance"].filters[6].options
				// }
			}
		},
		{
			fieldname: "budget_against_filter",
			label: __('Dimension Filter'),
			fieldtype: "MultiSelectList",
			get_data: function (txt) {
				if (!frappe.query_report.filters) return;

				let budget_against = frappe.query_report.get_filter_value('budget_against');
				if (!budget_against) return;

				console.log(" budget_against" + budget_against + " txt" + txt)
				return frappe.db.get_link_options(budget_against, txt);
			}
		},
		{
			fieldname: "root_type",
			label: __("Root Type"),
			fieldtype: "MultiSelectList",
			options: [__("Asset"), "Liability", "Income", "Expense"],
			default: "Expense",
			on_change: function () {
				frappe.query_report.set_filter_value("account", []);
				frappe.query_report.refresh();
			}
		},
		{
			fieldname: "account",
			label: __("Account"),
			fieldtype: "Link",
			options: "Account",
			get_query: function () {
				var root = frappe.query_report.get_filter_value('root_type');				
				if (root.length<1) {					
					return {
						filters: [
							["Account", "company", "=", frappe.query_report.get_filter_value('company')]
						]
					}
				}
				else {
					return {
						filters: [
							["Account", "root_type", "in", root],
							["Account", "company", "=", frappe.query_report.get_filter_value('company')]
						]
					}
				}
			}
		},
		{
			fieldname: "project",
			label: __("Project"),
			fieldtype: "Link",
			options: "Project",
			depends_on: 'eval:doc.budget_against=="Task"'
		}
	]
};
erpnext.dimension_filters.forEach((dimension) => {
	frappe.query_reports["Accounting Dimension Balance"].filters[4].options.push(dimension["document_type"]);
});
