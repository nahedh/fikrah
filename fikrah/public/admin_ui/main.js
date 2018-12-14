const angularCompile = function (html) {
    const angularApp = angular.element($('body')).scope();
    return angularApp.angularCompile(html);
};

function module_page_ui(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Modules',
        single_column: false,
        ui_main_sidebar: true,
        ui_hide_secondary_sidebar: false
    });

    frappe.modules_page = page;
    frappe.module_links = {};
    page.section_data = {};


    page.wrapper.find('.page-head h1').css({'padding-left': '15px'});
    // page.wrapper.find('.page-content').css({'margin-top': '0px'});

    // menu
    page.add_menu_item(__('Set Desktop Icons'), function () {
        frappe.route_options = {
            "user": frappe.session.user
        };
        frappe.set_route("modules_setup");
    });

    if (frappe.user.has_role('System Manager')) {
        page.add_menu_item(__('Install Apps'), function () {
            frappe.set_route("applications");
        });
    }

    page.get_page_modules = () => {
        return frappe.get_desktop_icons(true)
            .filter(d => d.type === 'module' && !d.blocked)
            .sort((a, b) => {
                return (a._label > b._label) ? 1 : -1;
            });
    };

    let get_module_sidebar_item = (item) => `<li class="module-sidebar-item">
		<a class="md-button module-link" ng-click="closeSideBar()" data-name="${item.module_name}" href="#modules/${item.module_name}">
			<i class="${item.icon} pull-right"></i>
			<span>${item._label}</span>
		</a>
	</li>`;
    let get_sidebar_html = () => {
        let sidebar_items_html = page.get_page_modules()
            .map(get_module_sidebar_item.bind(this)).join("");

        return `<ul class="module-sidebar-nav">
			${sidebar_items_html}
		</ul>`;
    };

    // render sidebar
    page.sidebar.html(angularCompile(get_sidebar_html()));

    // help click
    page.main.on("click", '.module-section-link[data-type="help"]', function () {
        frappe.help.show_video($(this).attr("data-youtube-id"));
        return false;
    });

    // notifications click
    page.main.on("click", '.open-notification', function () {
        var doctype = $(this).attr('data-doctype');
        if (doctype) {
            frappe.ui.notifications.show_open_count_list(doctype);
        }
    });

    page.activate_link = function (link) {
        page.last_link = link;
        page.wrapper.find('.module-sidebar-item.active, .module-link.active').removeClass('active');
        $(link).addClass('active').parent().addClass("active");
        show_section($(link).attr('data-name'));
    };

    var show_section = function (module_name) {
        if (!module_name) return;
        if (module_name in page.section_data) {
            render_section(page.section_data[module_name]);
        } else {
            page.main.empty();
            return frappe.call({
                method: "frappe.desk.moduleview.get",
                args: {
                    module: module_name
                },
                callback: function (r) {
                    var m = frappe.get_module(module_name);
                    m.data = r.message.data;
                    process_data(module_name, m.data);
                    page.section_data[module_name] = m;
                    render_section(m);
                },
                freeze: true,
            });
        }

    };

    var render_section = function (m) {
        page.set_title(__(m.label));
        page.main.html(angularCompile(frappe.render_template('ui-modules-page', m)));

        // if(frappe.utils.is_xs() || frappe.utils.is_sm()) {
        // 	// call this after a timeout, becuase a refresh will set the page to the top
        // 	setTimeout(function() {
        // 		$(document).scrollTop($('.module-body').offset().top - 150);
        // 	}, 100);
        // }

        //setup_section_toggle();
        frappe.app.update_notification_count_in_modules();
    };

    var process_data = function (module_name, data) {
        frappe.module_links[module_name] = [];
        data.forEach(function (section) {
            section.items.forEach(function (item) {
                item.style = '';
                if (item.type === "doctype") {
                    item.doctype = item.name;

                    // map of doctypes that belong to a module
                    frappe.module_links[module_name].push(item.name);
                }
                if (!item.route) {
                    if (item.link) {
                        item.route = strip(item.link, "#");
                    }
                    else if (item.type === "doctype") {
                        if (frappe.model.is_single(item.doctype)) {
                            item.route = 'Form/' + item.doctype;
                        } else {
                            if (item.filters) {
                                frappe.route_options = item.filters;
                            }
                            item.route = "List/" + item.doctype;
                            //item.style = 'font-weight: 500;';
                        }
                        // item.style = 'font-weight: bold;';
                    }
                    else if (item.type === "report" && item.is_query_report) {
                        item.route = "query-report/" + item.name;
                    }
                    else if (item.type === "report") {
                        item.route = "Report/" + item.doctype + "/" + item.name;
                    }
                    else if (item.type === "page") {
                        item.route = item.name;
                    }
                }

                if (item.route_options) {
                    item.route += "?" + $.map(item.route_options, function (value, key) {
                        return encodeURIComponent(key) + "=" + encodeURIComponent(value);
                    }).join('&');
                }

                if (item.type === "page" || item.type === "help" || item.type === "report" ||
                    (item.doctype && frappe.model.can_read(item.doctype))) {
                    item.shown = true;
                }
            });
        });
    };
}

function build_custom_core_ui(wrapper) {
    switch (wrapper.page_name_id) {
        case 'modules':
            module_page_ui(wrapper);
            break;
    }
}


frappe.utils.scroll_to = function scroll_to(element, animate, additional_offset) {
    var y = 0;
    if (element && typeof element === 'number') {
        y = element;
    } else if (element) {
        var header_offset = $(".navbar").height() + $(".page-head").height();
        var y = $(element).offset().top - header_offset - cint(additional_offset);
    }

    if (y < 0) {
        y = 0;
    }

    if (y == $('.ui-page-scroll').scrollTop()) {
        return;
    }

    if (animate !== false) {
        $(".ui-page-scroll").animate({scrollTop: y});
    } else {
        $(window).scrollTop(y);
    }
};


frappe.ui.toolbar.Toolbar = frappe.ui.toolbar.Toolbar.extend({
    init: function init() {

        const template = angularCompile(frappe.render_template("ui-header", {
            avatar: frappe.avatar(frappe.session.user)
        }));

        $('#ui-header').append(template);
        // $('.dropdown-toggle').dropdown();

        const awesome_bar = new frappe.search.AwesomeBar();
        awesome_bar.setup("#ui-search-input");
        awesome_bar.setup("#modal-search");

        this.make();

    },

    setup_help: function () {
        frappe.provide('frappe.help');
        frappe.help.show_results = show_results;

        this.search = new frappe.search.SearchDialog();
        frappe.provide('frappe.searchdialog');
        frappe.searchdialog.search = this.search;

        $(".ui-dropdown-help > .md-button").on("click", function () {
            console.log('tessst');
            $(".ui-dropdown-help input").focus();
        });

        $(".ui-dropdown-help .ui-dropdown-help-menu").on("click", "input, button", function (e) {
            e.stopPropagation();
        });

        $("#input-help").on("keydown", function (e) {
            if (e.which == 13) {
                var keywords = $(this).val();
                show_help_results(keywords);
                $(this).val("");
            }
        });

        $("#input-help-button").on("click", function () {
            var keywords = $("#input-help").val();
            show_help_results(keywords);
            $(this).val("");
        });

        $(document).on("page-change", function () {


            var $help_links = $(".ui-dropdown-help #help-links");
            $help_links.html("");

            var route = frappe.get_route_str();
            var breadcrumbs = route.split("/");

            var links = [];
            for (var i = 0; i < breadcrumbs.length; i++) {
                var r = route.split("/", i + 1);
                var key = r.join("/");
                var help_links = frappe.help.help_links[key] || [];
                links = $.merge(links, help_links);
            }

            if (links.length === 0) {
                $help_links.next().hide();
            }
            else {
                $help_links.next().show();
            }

            for (var i = 0; i < links.length; i++) {
                var link = links[i];
                var url = link.url;
                var app_name = url.split('//', 2)[1].split('/', 2)[1];
                var data_path = url.slice(url.indexOf('/user'));
                if (data_path.lastIndexOf('.')) {
                    data_path = data_path.slice(0, data_path.lastIndexOf('.'));
                }
                data_path = data_path.replace('user', app_name);

                $("<a>", {
                    href: link.url,
                    text: link.label,
                    target: "_blank",
                    "data-path": data_path
                }).appendTo($help_links);
            }

            $('.ui-dropdown-help .ui-dropdown-help-menu').on('click', 'a', show_results);
        });

        var $result_modal = frappe.get_modal("", "");
        $result_modal.addClass("help-modal");

        $(document).on("click", ".help-modal a", show_results);

        var me = this;

        function show_help_results(keywords) {
            me.search.init_search(keywords, "help");
        }

        function show_results(e) {
            //edit links
            var href = e.target.href;
            if (href.indexOf('blob') > 0) {
                window.open(href, '_blank');
            }
            var converter = new Showdown.converter();
            var path = $(e.target).attr("data-path");
            if (path) {
                e.preventDefault();
                frappe.call({
                    method: "frappe.utils.help.get_help_content",
                    args: {
                        path: path
                    },
                    callback: function (r) {
                        if (r.message && r.message.title) {
                            $result_modal.find('.modal-title').html("<span>"
                                + r.message.title + "</span>");
                            $result_modal.find('.modal-body').html(r.message.content);
                            $result_modal.modal('show');
                        }
                    }
                });
            }
        }
    },
});
frappe.views.Container = frappe.views.Container.extend({
    init: function init() {
        this.container = $('#ui-content').get(0);
        this.page = null;
        this.pagewidth = $(this.container).width();
        this.pagemargin = 50;

        var me = this;

        $(document).on("page-change", function () {
            var route_str = frappe.get_route_str();
            $('body').attr('data-ui-main-sidebar', me.has_ui_sidebar() ? 1 : 0);
            $("body").attr("data-route", route_str);
            $("body").attr("data-sidebar", me.has_sidebar() ? 1 : 0);
        });

        $(document).bind('rename', function (event, dt, old_name, new_name) {
            frappe.breadcrumbs.rename(dt, old_name, new_name);
        });
    },
    add_page: function (label) {
        const page = $(angularCompile('<div layout-fill layout layout-align="center center" class="ui-main-container"></div>'))
            .attr('id', "page-" + label)
            .attr("data-page-route", label)
            .hide()
            .appendTo(this.container).get(0);
        page.label = label;
        frappe.pages[label] = page;

        return page;
    },
    has_ui_sidebar: function has_sidebar() {
        const route_str = frappe.get_route_str();

        let flag = frappe.ui.pages[route_str] && frappe.ui.pages[route_str].ui_main_sidebar;

        if (!flag) {
            const main_page = route_str.split('/')[0];
            flag = $('.ui-main-container[data-page-route="' + main_page + '"] #ui-sidebar').length ? 1 : 0;
        }

        return flag;
    }
});
frappe.Application = frappe.Application.extend({
    make_page_container: function () {
        if ($("#ui-content").length) {
            $(".splash").remove();
            frappe.temp_container = $("<div id='temp-container' style='display: none;'>")
                .appendTo("body");
            frappe.container = new frappe.views.Container();
        }
    }
});
frappe.ui.Page = frappe.ui.Page.extend({
    init: function init(opts) {
        $.extend(this, opts);

        this.set_document_title = true;
        this.buttons = {};
        this.fields_dict = {};
        this.views = {};

        this.make();
        frappe.ui.pages[frappe.get_route_str()] = this;
    },
    add_main_section: function () {

        const page = angularCompile(frappe.render_template("ui-page", {
            ui_hide_secondary_sidebar: this.ui_hide_secondary_sidebar, // this.single_column,
            single_column: this.single_column,
            ui_main_sidebar: this.ui_main_sidebar, // this.single_column,
            nav_secondary_id: frappe.get_route_str(),
            navigation_dir: frappe.boot.lang === 'ar' ? 'md-sidenav-right' : 'md-sidenav-left', // this.single_column,
        }));
        $(page).appendTo(this.wrapper);

        this.add_view("main", "<div class='ui-page-wrapper'><div class='ui-page-contents'></div></div>");

        this.setup_page();

    },
    add_view: function (name, html) {
        let element = angularCompile(html);
        if (typeof(html) === "string") {
            element = $(html);
        }
        this.views[name] = element.appendTo($(this.wrapper).find("#ui-page"));
        if (!this.current_view) {
            this.current_view = this.views[name];
        } else {
            this.views[name].toggle(false);
        }
        return this.views[name];
    },
    setup_page: function () {
        this.$title_area = this.wrapper.find(".ui-module-header .ui-menu-content h1");

        this.$sub_title_area = this.wrapper.find("h6");

        if (this.set_document_title !== undefined)
            this.set_document_title = this.set_document_title;

        if (this.title)
            this.set_title(this.title);

        if (this.icon)
            this.get_main_icon(this.icon);

        this.body = this.wrapper.find("#ui-page");
        this.main = this.wrapper.find(".ui-page-contents");
        if (this.ui_main_sidebar) {
            this.sidebar = this.wrapper.find("#ui-sidebar .ui-md-content");
        } else {
            this.sidebar = this.wrapper.find("#ui-sidebar-secondary .ui-md-content");
        }


        this.footer = this.wrapper.find("#ui-footer");
        this.indicator = this.wrapper.find(".ui-indicator");

        this.page_actions = this.wrapper.find(".ui-page-actions");

        this.btn_primary = this.page_actions.find(".primary-action");
        this.btn_secondary = this.page_actions.find(".secondary-action");

        this.menu = this.page_actions.find("#ui-page-menu-list .ui-menu");
        this.menu_btn_group = this.page_actions.find("#ui-page-menu-list");

        this.actions = this.page_actions.find(".actions-btn-group .dropdown-menu");
        this.actions_btn_group = this.page_actions.find(".actions-btn-group");

        this.page_form = $('<div class="page-form row hide"></div>').prependTo(this.main);
        this.inner_toolbar = $('<div class="form-inner-toolbar hide"></div>').prependTo(this.main);
        this.icon_group = this.page_actions.find(".ui-page-icon-group");


        if (this.make_page) {
            this.make_page();
        }
    },
    add_action_icon: function (icon, click) {
        return $(angularCompile('<md-button class="md-icon-button text-muted no-decoration"><md-icon md-font-icon="' + icon + '"></md-icon></md-button>'))
            .appendTo(this.icon_group.removeClass("hide"))
            .click(click);
    },
    set_title: function set_title(txt, icon) {
        if (!txt) txt = "";

        txt = strip_html(txt);
        this.title = txt;

        frappe.utils.set_title(txt);
        if (icon) {
            txt = '<span class="' + icon + ' text-muted" style="font-size: inherit;"></span> ' + txt;
        }
        this.$title_area.html(txt);
    },
    add_dropdown_item: function (label, click, standard, parent) {
        let item_selector = 'md-menu-item > a.md-button.grey-link';

        parent.parent().removeClass("hide");

        var $li = $('<md-menu-item><a class="md-button grey-link">' + label + '</a></md-menu-item>'),
            $link = $li.find("a").on("click", click);

        if (this.is_in_group_button_dropdown(parent, item_selector, label)) return;

        if (standard === true) {
            $li.appendTo(parent);
        } else {
            this.divider = parent.find(".divider");
            if (!this.divider.length) {
                this.divider = $('<md-menu-divider class="divider user-action"></md-menu-divider>').prependTo(parent);
            }
            $li.addClass("user-action").insertBefore(this.divider);
        }

        return $link;
    },
    add_sidebar_item: function (label, action, insert_after, prepend) {
        var parent = this.sidebar.find(".sidebar-menu.standard-actions");
        var li = $('<li>');
        var link = $('<a>').html(label).on("click", action).appendTo(li);

        if (insert_after) {
            li.insertAfter(parent.find(insert_after));
        } else {
            if (prepend) {
                li.prependTo(parent);
            } else {
                li.appendTo(parent);
            }
        }
        return link;
    }
});

frappe.ui.form.Sidebar = frappe.ui.form.Sidebar.extend({
    make: function () {
        var sidebar_content = frappe.render_template("ui-form-sidebar", {doctype: this.frm.doctype, frm: this.frm});

        this.sidebar = $(angularCompile('<div layout-fill class="form-sidebar overlay-sidebar"></div>'))
            .html(angularCompile(sidebar_content))
            .appendTo(this.page.sidebar.empty());


        this.image_section = this.sidebar.find(".ui-sidebar-image");
        this.image_wrapper = this.image_section.find('.ui-sidebar-image-wrapper');


        this.comments = this.sidebar.find(".ui-sidebar-section.ui-comments");
        this.user_actions = this.sidebar.find(".user-actions");

        this.ratings = this.sidebar.find(".sidebar-rating");

        this.make_attachments();
        this.make_assignments();
        this.make_shared();
        this.make_viewers();
        this.make_tags();
        this.make_like();

        this.bind_events();
        frappe.ui.form.setup_user_image_event(this.frm);

        this.refresh();

    },
    make_tags: function make_tags() {
        var me = this;
        if (this.frm.meta.issingle) {
            this.sidebar.find(".ui-tags .ui-section-related").toggle(false);
            return;
        }

        this.frm.tags = new frappe.ui.TagEditor({
            parent: this.sidebar.find(".ui-tags .ui-section-related"),
            frm: this.frm,
            on_change: function on_change(user_tags) {
                me.frm.doc._user_tags += "," + user_tags;
            }
        });
    },
    make_shared: function make_shared() {
        this.frm.shared = new frappe.ui.form.Share({
            frm: this.frm,
            parent: this.sidebar.find(".ui-sharewith .ui-section-related")
        });
    },
    make_attachments: function () {
        var me = this;
        this.frm.attachments = new frappe.ui.form.Attachments({
            parent: me.sidebar.find(".ui-attachments"),
            frm: me.frm
        });
    },
    make_assignments: function make_assignments() {
        this.frm.assign_to = new frappe.ui.form.AssignTo({
            parent: this.sidebar.find(".ui-assignto"),
            frm: this.frm
        });
    }
});

frappe.ui.form.Attachments = frappe.ui.form.Attachments.extend({
    make: function () {
        var me = this;
        this.parent.find(".ui-section-label .md-button").click(function () {
            me.new_attachment();
        });
        this.attachments_label = this.parent.find(".ui-section-related");
        this.add_attachment_wrapper = this.attachments_label;
    },
    refresh: function () {
        var me = this;

        if (this.frm.doc.__islocal) {
            this.parent.toggle(false);
            return;
        }
        this.parent.toggle(true);
        this.parent.find(".attachment-row").remove();

        var max_reached = this.max_reached();
        this.add_attachment_wrapper.removeClass("hide");

        // add attachment objects
        var attachments = this.get_attachments();
        if (attachments.length) {
            attachments.forEach(function (attachment) {
                me.add_attachment(attachment)
            });
        } else {
            this.attachments_label.removeClass("has-attachments");
        }

    },
    add_attachment: function add_attachment(attachment) {
        var file_name = attachment.file_name;
        var file_url = this.get_file_url(attachment);
        var fileid = attachment.name;
        if (!file_name) {
            file_name = file_url;
        }

        var me = this;
        let attachment_row = `<li class="attachment-row" layout layout-align="space-between center">
                                <div layout layout-align="start center">
                                    %(lock_icon)s
                                    <a href="%(file_url)s" target="_blank" title="%(file_name)s">
                                        %(file_name)s
                                    </a>
                                </div>
                                <md-button class="close md-icon-button">
                                    <md-icon md-font-icon="fa fa-times"></md-icon>
                                </md-button>
                            </li>`;

        var $attach = $(
            angularCompile(
                repl(
                    attachment_row,
                    {
                        lock_icon: attachment.is_private ? '<i class="fa fa-lock fa-fw text-warning"></i> ' : "",
                        file_name: file_name,
                        file_url: frappe.urllib.get_full_url(file_url)
                    }
                )
            )
        ).appendTo(this.attachments_label.addClass("has-attachments"));

        var $close = $attach.find(".close").data("fileid", fileid).click(function () {
            var remove_btn = this;
            frappe.confirm(__("Are you sure you want to delete the attachment?"), function () {
                me.remove_attachment($(remove_btn).data("fileid"));
            });
            return false;
        });

        if (!frappe.model.can_write(this.frm.doctype, this.frm.name)) {
            $close.remove();
        }
    }
});

frappe.ui.form.AssignTo = frappe.ui.form.AssignTo.extend({
    init: function init(opts) {
        var me = this;

        $.extend(this, opts);
        this.btn = this.parent.find(".ui-section-label .md-button").on("click", function () {
            me.add();
        });
        this.btn_wrapper = this.btn.parent();

        this.refresh();
    },
    render: function (d) {
        var me = this;
        this.frm.get_docinfo().assignments = d;
        this.parent.find(".assignment-row").remove();

        if (me.primary_action) {
            me.primary_action.remove();
            me.primary_action = null;
        }

        if (this.dialog) {
            this.dialog.hide();
        }

        if (d && d.length) {
            for (var i = 0; i < d.length; i++) {
                var info = frappe.user_info(d[i].owner);
                info.assign_to_name = d[i].name
                info.owner = d[i].owner;
                info.avatar = frappe.avatar(d[i].owner);
                info.description = d[i].description || "";

                info._fullname = info.fullname;
                if (info.fullname.length > 10) {
                    info._fullname = info.fullname.substr(0, 10) + '...';
                }

                const template = `<li class="assignment-row" layout layout-align="space-between center">
                                        <div layout layout-align="start center">
                                            %(avatar)s
                                            <a href="#Form/ToDo/%(assign_to_name)s" target="_blank" title="%(file_name)s">
                                               %(_fullname)s
                                            </a>
                                        </div>
                                        <md-button class="close md-icon-button" data-owner="%(owner)s">
                                            <md-icon md-font-icon="fa fa-times"></md-icon>
                                        </md-button>
                                    </li>`;

                $(
                    angularCompile(
                        repl(template, info)
                    )
                ).appendTo(this.parent.find('.ui-section-related'));

                if (d[i].owner === frappe.session.user) {
                    me.primary_action = this.frm.page.add_menu_item(__("Assignment Complete"), function () {
                        me.remove(frappe.session.user);
                    }, "fa fa-check", "btn-success")
                }

                if (!(d[i].owner === frappe.session.user || me.frm.perm[0].write)) {
                    me.parent.find('a.close').remove();
                }
            }

            // set remove
            this.parent.find('a.close').click(function () {
                me.remove($(this).attr('data-owner'));
                return false;
            });

            //this.btn_wrapper.addClass("hide");
        } else {
            //this.btn_wrapper.removeClass("hide");
        }
    }
});

frappe.views.Page = frappe.views.Page.extend({
    init: function (name, wrapper) {
        this.name = name;
        var me = this;
        // web home page
        if (name == window.page_name) {
            this.wrapper = document.getElementById('page-' + name);
            this.wrapper.label = document.title || window.page_name;
            this.wrapper.page_name = window.page_name;
            frappe.pages[window.page_name] = this.wrapper;
        } else {
            this.pagedoc = locals.Page[this.name];
            if (!this.pagedoc) {
                frappe.show_not_found(name);
                return;
            }
            this.wrapper = frappe.container.add_page(this.name);
            this.wrapper.label = this.pagedoc.title || this.pagedoc.name;
            this.wrapper.page_name = this.pagedoc.name;

            // set content, script and style
            if (this.pagedoc.content)
                this.wrapper.innerHTML = this.pagedoc.content;
            frappe.dom.eval(this.pagedoc.__script || this.pagedoc.script || '');
            frappe.dom.set_style(this.pagedoc.style || '');
        }

        /* custom ui */

        const custom_core_pages_ui = [
            'modules'
        ];

        if (custom_core_pages_ui.indexOf(this.name) !== -1) {
            // Custom UI
            this.wrapper.page_name_id = this.name;
            this.wrapper.on_page_load_ui = build_custom_core_ui;
            this.trigger_page_event('on_page_load_ui');
        } else {
            // Default UI
            this.trigger_page_event('on_page_load');
        }

        // set events
        $(this.wrapper).on('show', function () {
            cur_frm = null;
            me.trigger_page_event('on_page_show');
            me.trigger_page_event('refresh');
        });
    }
});

frappe.ui.form.Share = frappe.ui.form.Share.extend({
    render_sidebar: function render_sidebar() {
        var me = this;
        this.parent.empty();

        var shared = this.shared || this.frm.get_docinfo().shared;
        shared = shared.filter(function (d) {
            return d;
        });
        var users = [];
        for (var i = 0, l = shared.length; i < l; i++) {
            var s = shared[i];

            if (s.everyone) {
                users.push({
                    icon: "octicon octicon-megaphone text-muted",
                    avatar_class: "avatar-empty share-doc-btn shared-with-everyone",
                    title: __("Shared with everyone")
                });
            } else {
                var user_info = frappe.user_info(s.user);
                users.push({
                    image: user_info.image,
                    fullname: user_info.fullname,
                    abbr: user_info.abbr,
                    color: user_info.color,
                    title: __("Shared with {0}", [user_info.fullname])
                });
            }
        }

        if (!me.frm.doc.__islocal) {
            users.push({
                icon: "octicon octicon-plus text-muted",
                avatar_class: "avatar-empty share-doc-btn",
                title: __("Share")
            });
        }

        this.parent.append(angularCompile(frappe.render_template("ui-users-in-sidebar", {"users": users})));

        const shareDialog = function () {
            me.frm.share_doc();
        };

        this.parent.closest('.ui-sidebar-section').find('.ui-section-label .md-button').on('click', shareDialog);
        this.parent.find(".avatar").on("click", shareDialog);
    }
});

frappe.breadcrumbs.update = function () {
    var breadcrumbs = frappe.breadcrumbs.all[frappe.breadcrumbs.current_page()];

    if (!frappe.visible_modules) {
        frappe.visible_modules = $.map(frappe.get_desktop_icons(true), (m) => {
            return m.module_name;
        });
    }

    var $breadcrumbs = $(".ui-navbar-breadcrumbs-all");
    $breadcrumbs.empty();
    const navigation = angularCompile('<li><a href="#">' + __("Home") + '</a><md-icon md-font-icon="fa fa-angle-left"></md-icon></li>');
    $(navigation).appendTo($breadcrumbs);

    if (!breadcrumbs) {
        $("body").addClass("no-breadcrumbs");
        return;
    }

    // get preferred module for breadcrumbs, based on sent via module
    var from_module = frappe.breadcrumbs.get_doctype_module(breadcrumbs.doctype);

    if (from_module) {
        breadcrumbs.module = from_module;
    } else if (frappe.breadcrumbs.preferred[breadcrumbs.doctype] !== undefined) {
        // get preferred module for breadcrumbs
        breadcrumbs.module = frappe.breadcrumbs.preferred[breadcrumbs.doctype];
    }

    const get_nav_item = () => {

    };

    if (breadcrumbs.module) {
        if (in_list(["Core", "Email", "Custom", "Workflow", "Print"], breadcrumbs.module)) {
            breadcrumbs.module = "Setup";
        }

        if (frappe.get_module(breadcrumbs.module)) {
            // if module access exists
            var module_info = frappe.get_module(breadcrumbs.module),
                icon = module_info && module_info.icon,
                label = module_info ? module_info.label : breadcrumbs.module;


            if (module_info && !module_info.blocked && frappe.visible_modules.includes(module_info.module_name)) {
                $(angularCompile(repl('<li><a href="#modules/%(module)s">%(label)s</a><md-icon md-font-icon="fa fa-angle-left"></md-icon></li>',
                    {module: breadcrumbs.module, label: __(label)})))
                    .appendTo($breadcrumbs);
            }
        }
    }
    if (breadcrumbs.doctype && frappe.get_route()[0] === "Form") {
        if (breadcrumbs.doctype === "User"
            && frappe.user.is_module("Setup") === -1
            || frappe.get_doc('DocType', breadcrumbs.doctype).issingle) {
            // no user listview for non-system managers and single doctypes
        } else {
            var route;
            if (frappe.boot.treeviews.indexOf(breadcrumbs.doctype) !== -1) {
                var view = frappe.model.user_settings[breadcrumbs.doctype].last_view || 'Tree';
                route = view + '/' + breadcrumbs.doctype;
            } else {
                route = 'List/' + breadcrumbs.doctype;
            }
            $(angularCompile(repl('<li><a href="#%(route)s">%(label)s</a><md-icon md-font-icon="fa fa-angle-left"></md-icon></li>',
                {route: route, label: __(breadcrumbs.doctype)})))
                .appendTo($breadcrumbs);
        }
    }

    $("body").removeClass("no-breadcrumbs");
};

frappe.ui.notifications = {
    config: {
        "ToDo": {label: __("To Do")},
        "Chat": {label: __("Chat"), route: "chat"},
        "Event": {label: __("Calendar"), route: "List/Event/Calendar"},
        "Email": {label: __("Email"), route: "List/Communication/Inbox"},
        "Likes": {
            label: __("Likes"),
            click: function () {
                frappe.route_options = {show_likes: true};
                if (frappe.get_route()[0] == "activity") {
                    frappe.pages['activity'].page.list.refresh();
                } else {
                    frappe.set_route("activity");
                }
            }
        },
    },
    show_open_count_list: function (doctype) {
        let filters = this.boot_info.conditions[doctype];
        if (filters && $.isPlainObject(filters)) {
            if (!frappe.route_options) {
                frappe.route_options = {};
            }
            $.extend(frappe.route_options, filters);
        }
        let route = frappe.get_route();
        if (route[0] === "List" && route[1] === doctype) {
            frappe.pages["List/" + doctype].list_view.refresh();
        } else {
            frappe.set_route("List", doctype);
        }
    },
    update_notifications: function () {
        this.total = 0;
        this.dropdown = $("#ui-dropdown-notification").empty();
        this.boot_info = frappe.boot.notification_info;
        let defaults = ["Comment", "ToDo", "Event"];

        this.get_counts(this.boot_info.open_count_doctype, 1, defaults);
        this.get_counts(this.boot_info.open_count_other, 1);

        // Target counts are stored for docs per doctype
        let targets = {doctypes: {}}, map = this.boot_info.targets;
        Object.keys(map).map(doctype => {
            Object.keys(map[doctype]).map(doc => {
                targets[doc] = map[doctype][doc];
                targets.doctypes[doc] = doctype;
            });
        });
        this.get_counts(targets, 1, null, ["doctypes"], true);
        this.get_counts(this.boot_info.open_count_doctype,
            0, null, defaults);

        this.bind_list();

        // switch colour on the navbar and disable if no notifications
        $(".ui-navbar-new-comments")
            .html(this.total > 99 ? '99+' : this.total)
            .toggleClass("navbar-new-comments-true", this.total ? true : false)
            .parent().toggleClass("disabled", this.total ? false : true);
    },
    get_counts: function (map, divide, keys, excluded = [], target = false) {
        let empty_map = 1;
        keys = keys ? keys
            : Object.keys(map).sort().filter(e => !excluded.includes(e));
        keys.map(key => {
            let doc_dt = (map.doctypes) ? map.doctypes[key] : undefined;
            if (map[key] > 0 || target) {
                this.add_notification(key, map[key], doc_dt, target);
                empty_map = 0;
            }
        });
        if (divide && !empty_map) {
            this.dropdown.append($(angularCompile('<md-menu-divider></md-menu-divider>')));
        }
    },
    add_notification: function (name, value, doc_dt, target = false) {
        let label = this.config[name] ? this.config[name].label : name;
        let title = target ? `title="Your Target"` : '';
        let $list_item = !target
            ? $(angularCompile(`<md-menu-item>
                <md-button class="badge-hover" data-doctype="${name}" ${title}>
                    <span layout layout-align="space-between center">
                        <span>${__(label)}</span>
                        <em>${value}</em>
                    </span>
                </md-button>
			</md-menu-item>`))
            : $(angularCompile(`<md-menu-item>
                <md-button class="progress-small" ${title} data-doctype="${doc_dt}" data-doc="${name}">
                    <span class="dropdown-item-label">
                        <span>${__(label)}</span>
                    </span>
                    <div class="progress-chart">
                        <div class="progress">
                            <div class="progress-bar" style="width: ${value}%"></div>
                        </div>
                    </div>
                </md-button>
			</md-menu-item>`));
        this.dropdown.append($list_item);
        if (!target) this.total += value;
    },
    bind_list: function () {
        var me = this;
        $("#ui-dropdown-notification .md-button").on("click", function () {
            var doctype = $(this).attr("data-doctype");
            var doc = $(this).attr("data-doc");
            if (!doc) {
                var config = me.config[doctype] || {};
                if (config.route) {
                    frappe.set_route(config.route);
                } else if (config.click) {
                    config.click();
                } else {
                    frappe.ui.notifications.show_open_count_list(doctype);
                }
            } else {
                frappe.set_route("Form", doctype, doc);
            }
        });
    },
};

frappe.views.ListSidebar = frappe.views.ListSidebar.extend({
    make: function () {
        var sidebar_content = angularCompile(frappe.render_template("ui-list-sidebar", {doctype: this.list_view.doctype}));

        this.sidebar = $('<div class="list-sidebar overlay-sidebar"></div>')
            .html(sidebar_content)
            .appendTo(this.page.sidebar.empty());

        this.setup_reports();
        this.setup_assigned_to_me();
        this.setup_views();
        this.setup_kanban_boards();
        this.setup_calendar_view();
        this.setup_email_inbox();

        let limits = frappe.boot.limits;

        if (limits.upgrade_url && limits.expiry && !frappe.flags.upgrade_dismissed) {
            this.setup_upgrade_box();
        }
    },
    setup_reports: function () {
        // add reports linked to this doctype to the dropdown
        var me = this;
        var added = [];
        var dropdown = this.page.sidebar.find('.ui-reports-list');
        var divider = false;

        var add_reports = function (reports) {
            $.each(reports, function (name, r) {
                if (!r.ref_doctype || r.ref_doctype == me.doctype) {
                    var report_type = r.report_type === 'Report Builder'
                        ? 'Report/' + r.ref_doctype : 'query-report';
                    var route = r.route || report_type + '/' + (r.title || r.name);

                    if (added.indexOf(route) === -1) {
                        // don't repeat
                        added.push(route);

                        if (!divider) {
                            me.get_divider().appendTo(dropdown);
                            divider = true;
                        }

                        const template = `<md-menu-item>
                                            <a class="md-button" href="#${route}">${__(r.title || r.name)}</a>
                                        </md-menu-item>`;
                        $(angularCompile(template)).appendTo(dropdown);
                    }
                }
            });
        };

        // from reference doctype
        if (this.list_view.list_renderer.settings.reports) {
            add_reports(this.list_view.list_renderer.settings.reports)
        }

        // from specially tagged reports
        add_reports(frappe.boot.user.all_reports || []);
    },
    get_divider: function () {
        return $(angularCompile(`<md-menu-divider></md-menu-divider>`));
    },
    setup_assigned_to_me: function () {
        var me = this;
        this.page.sidebar.find(".ui-assigned-to-me").on("click", function () {
            me.list_view.assigned_to_me();
        });
    },
    setup_kanban_boards: function () {
        // add kanban boards linked to this doctype to the dropdown
        var me = this;
        var $dropdown = this.page.sidebar.find('.ui-kanban-list');
        var divider = false;

        var meta = frappe.get_meta(this.doctype);
        var boards = meta && meta.__kanban_boards;
        if (!boards) return;

        boards.forEach(function (board) {
            var route = ["List", board.reference_doctype, "Kanban", board.name].join('/');
            if (!divider) {
                me.get_divider().appendTo($dropdown);
                divider = true;
            }
            const template = `<md-menu-item>
                <a class="md-button" href="#${route}">
                    <span>${__(board.name)}</span>
                    ${board.private ? '<md-icon md-font-icon="fa fa-lock" class="fa-fw text-warning"></md-icon>' : ''}
                </a>
			</md-menu-item>`;
            $(angularCompile(template)).appendTo($dropdown);
        });

        $dropdown.find('.new-kanban-board').click(function () {
            // frappe.new_doc('Kanban Board', {reference_doctype: me.doctype});
            var select_fields = frappe.get_meta(me.doctype)
                .fields.filter(function (df) {
                    return df.fieldtype === 'Select' &&
                        df.fieldname !== 'kanban_column';
                });

            var fields = [
                {
                    fieldtype: 'Data',
                    fieldname: 'board_name',
                    label: __('Kanban Board Name'),
                    reqd: 1
                }
            ];

            if (me.doctype === 'Task') {
                fields.push({
                    fieldtype: 'Link',
                    fieldname: 'project',
                    label: __('Project'),
                    options: 'Project'
                });
            }

            if (select_fields.length > 0) {
                fields = fields.concat([{
                    fieldtype: 'Select',
                    fieldname: 'field_name',
                    label: __('Columns based on'),
                    options: select_fields.map(df => df.label).join('\n'),
                    default: select_fields[0],
                    depends_on: 'eval:doc.custom_column===0'
                },
                    {
                        fieldtype: 'Check',
                        fieldname: 'custom_column',
                        label: __('Custom Column'),
                        default: 0
                    }]);
            }

            if (['Note', 'ToDo'].includes(me.doctype)) {
                fields[0].description = __('This Kanban Board will be private');
            }

            var d = new frappe.ui.Dialog({
                title: __('New Kanban Board'),
                fields: fields,
                primary_action_label: __('Save'),
                primary_action: function (values) {

                    var custom_column = values.custom_column !== undefined ?
                        values.custom_column : 1;

                    if (custom_column) {
                        var field_name = 'kanban_column';
                    } else {
                        if (!values.field_name) {
                            frappe.throw(__('Please select Columns Based On'));
                        }
                        var field_name =
                            select_fields
                                .find(df => df.label === values.field_name)
                                .fieldname;
                    }

                    me.add_custom_column_field(custom_column)
                        .then(function (custom_column) {
                            return me.make_kanban_board(values.board_name, field_name, values.project);
                        })
                        .then(function () {
                            d.hide();
                        }, function (err) {
                            frappe.msgprint(err);
                        });
                }
            });
            d.show();
        });
    },
    render_stat: function render_stat(field, stat, tags) {
        var me = this;
        var sum = 0;
        var stats = [];
        var label = frappe.meta.docfield_map[this.doctype][field] ? frappe.meta.docfield_map[this.doctype][field].label : field;

        stat = (stat || []).sort(function (a, b) {
            return b[1] - a[1];
        });
        $.each(stat, function (i, v) {
            sum = sum + v[1];
        });

        if (tags) {
            for (var t in tags) {
                var nfound = -1;
                for (var i in stat) {
                    if (tags[t] === stat[i][0]) {
                        stats.push(stat[i]);
                        nfound = i;
                        break;
                    }
                }
                if (nfound < 0) {
                    stats.push([tags[t], 0]);
                } else {
                    me.tempstats["_user_tags"].splice(nfound, 1);
                }
            }
            field = "_user_tags";
        } else {
            stats = stat;
        }
        var context = {
            field: field,
            stat: stats,
            sum: sum,
            label: field === '_user_tags' ? tags ? __(label) : __("Tags") : __(label)
        };

        this.sidebar.find(".ui-list-tags > div > span").text(context.label);
        const template = angularCompile(frappe.render_template("ui-list-sidebar-stat", context));

        var sidebar_stat = $(template).on("click", ".stat-link", function () {
            var fieldname = $(this).attr('data-field');
            var label = $(this).attr('data-label');
            if (label == "No Tags") {
                me.list_view.filter_list.add_filter(me.list_view.doctype, fieldname, 'not like', '%,%');
                me.list_view.run();
            } else {
                me.set_filter(fieldname, label);
            }
        }).appendTo(this.sidebar.find(".ui-list-tags .ui-section-related"));
    }
});

frappe.ui.form.Dashboard = frappe.ui.form.Dashboard.extend({
    init: function (opts) {
        $.extend(this, opts);
        this.section = this.frm.fields_dict._form_dashboard.wrapper;
        this.parent = this.section.find('.section-body');
        this.wrapper = $(angularCompile(frappe.render_template('ui-form-dashboard',
            {frm: this.frm}))).appendTo(this.parent);

        this.progress_area = this.wrapper.find(".progress-area");
        this.heatmap_area = this.wrapper.find('.form-heatmap');
        this.chart_area = this.wrapper.find('.form-graph');
        this.stats_area = this.wrapper.find('.form-stats');
        this.stats_area_row = this.stats_area.find('.row');

        this.links_area = this.wrapper.find('.ui-form-links');
        this.transactions_area = this.links_area.find('.ui-transactions');

    },
    after_refresh: function () {
        var me = this;
        // show / hide new buttons (if allowed)
        this.links_area.find('.ui-transaction-content .md-icon-button').each(function () {
            if (me.frm.can_create($(this).attr('data-doctype'))) {
                $(this).removeClass('hidden');
            }
        });
    },
    set_badge_count: function (doctype, open_count, count, names) {
        var $link = $(this.transactions_area)
            .find('.ui-transaction-content >li[data-doctype="' + doctype + '"]');

        if (open_count) {
            $link.find('.open-notification')
                .removeClass('hidden')
                .html((open_count > 99) ? '99+' : open_count);
        }

        if (count) {
            $link.find('.count')
                .removeClass('hidden')
                .html("(" + ((count > 99) ? '99+' : count) + ")");
        }

        if (this.data.internal_links[doctype]) {
            if (names && names.length) {
                $link.attr('data-names', names ? names.join(',') : '');
            } else {
                $link.find('.ui-open-transaction').attr('disabled', true);
            }
        }
    },
    render_links: function () {
        var me = this;
        this.links_area.removeClass('hidden');
        this.links_area.find('.ui-transaction-content .md-icon-button').addClass('hidden');
        if (this.data_rendered) {
            return;
        }

        //this.transactions_area.empty();

        this.data.frm = this.frm;

        const template = angularCompile(frappe.render_template('ui-form-links', this.data));
        $(template).appendTo(this.transactions_area);

        // bind links
        this.transactions_area.find(".badge-link").on('click', function () {
            me.open_document_list($(this).parent());
        });

        // bind open notifications
        this.transactions_area.find('.open-notification').on('click', function () {
            me.open_document_list($(this).parent(), true);
        });

        // bind new
        this.transactions_area.find('.ui-transaction-content .md-icon-button').on('click', function () {
            me.frm.make_new($(this).attr('data-doctype'));
        });

        this.data_rendered = true;
    }
});

frappe.get_desktop_icons = function (show_hidden, show_global) {

    var out = [];

    var add_to_out = function add_to_out(module) {
        var module = frappe.get_module(module.module_name, module);
        module.app_icon = frappe.ui.app_icon.get_html(module);
        out.push(module);
    };

    var show_module = function show_module(m) {
        var out = true;
        if (m.type === "page") {
            out = m.link in frappe.boot.page_info;
        } else if (m._report) {
            out = m._report in frappe.boot.user.all_reports;
        } else if (m._doctype) {
            out = frappe.boot.user.can_read.includes(m._doctype);
        } else {
            if (m.module_name === 'Learn') {
                out = true;
            } else if (m.module_name === 'Setup' && frappe.user.has_role('System Manager')) {
                out = true;
            } else {
                out = frappe.boot.user.allow_modules.indexOf(m.module_name) !== -1;
            }
        }
        if (m.hidden && !show_hidden) {
            out = false;
        }
        if (m.blocked && !show_global) {
            out = false;
        }
        return out;
    };

    for (var i = 0, l = frappe.boot.desktop_icons.length; i < l; i++) {
        var m = frappe.boot.desktop_icons[i];

        if (m.module_name === "Strategy") {
            m.icon = 'octicon octicon-graph';
        }

        if (['Setup', 'Core'].indexOf(m.module_name) === -1 && show_module(m)) {
            add_to_out(m);
        }
    }

    if (frappe.user_roles.includes('System Manager')) {
        var m = frappe.get_module('Setup');
        if (show_module(m)) add_to_out(m);
    }

    if (frappe.user_roles.includes('Administrator')) {
        var m = frappe.get_module('Core');
        if (show_module(m)) add_to_out(m);
    }

    return out;
};

frappe.dom.freeze = function freeze(msg, css_class) {
    if (!$('#freeze').length) {
        var freeze = $('<div id="freeze" class="modal-backdrop fade"></div>').on("click", function () {
            if (cur_frm && cur_frm.cur_grid) {
                cur_frm.cur_grid.toggle_view();
                return false;
            }
        }).appendTo("#ui-content");

        freeze.html(repl('<div class="freeze-message-container"><div class="freeze-message"><p class="lead">%(msg)s</p></div></div>', {msg: msg || ""}));

        setTimeout(function () {
            freeze.addClass("in");
        }, 1);
    } else {
        $("#freeze").addClass("in");
    }

    if (css_class) {
        $("#freeze").addClass(css_class);
    }

    frappe.dom.freeze_count++;
};

frappe.views.TreeView = frappe.views.TreeView.extend({
    make_page: function make_page() {
        var me = this;
        this.parent = frappe.container.add_page(this.page_name);
        frappe.ui.make_app_page({
            parent: this.parent,
            single_column: true,
            ui_hide_secondary_sidebar: true
        });

        this.page = this.parent.page;
        frappe.container.change_to(this.page_name);
        frappe.breadcrumbs.add(me.opts.breadcrumb || locals.DocType[me.doctype].module);

        this.set_title();

        this.page.main.css({
            "min-height": "300px",
            "padding-bottom": "25px"
        });

        if (this.opts.show_expand_all) {
            this.page.add_inner_button(__('Expand All'), function () {
                me.tree.rootnode.load_all();
            });
        }

        if (this.opts.view_template) {
            var row = $('<div class="row"><div>').appendTo(this.page.main);
            this.body = $('<div class="col-sm-6 col-xs-12"></div>').appendTo(row);
            this.node_view = $('<div class="col-sm-6 hidden-xs"></div>').appendTo(row);
        } else {
            this.body = this.page.main;
        }
    }
});

/*
frappe.PrintFormatBuilder = frappe.PrintFormatBuilder.extend({
    make: function () {
        this.page = frappe.ui.make_app_page({
            parent: this.parent,
            title: __("Print Format Builder"),
            single_column: true,
            ui_hide_secondary_sidebar: true
        });
    }
});*/
