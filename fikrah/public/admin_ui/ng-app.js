const app = angular.module('admin_ui', ['ngMaterial', 'ngMessages']);
app.config(function () {
});

app.run(function () {
});

app.directive('localizeEvent',
    function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                $(element).click(function (e) {
                    e.stopPropagation();
                });
            }
        };
    }
);
app.controller('main', function ($scope, $compile, $mdSidenav, $mdMedia) {

    const whenExists = (navID, event) => {
        const selector = '[md-component-id="' + navID + '"]';
        const sidebar = document.querySelectorAll(selector);
        const exists = sidebar.length;
        if (exists) {
            // console.log(selector + ' exists');
            $mdSidenav(navID)[event]();
            sidebar
        }else{
            console.log(selector + ' does not exists');
        }
    };

    $scope.closeSideBar = () => {
        whenExists('ui-sidebar', 'close');
        const secondaryID = frappe.get_route_str();
        whenExists('ui-sidebar-' + secondaryID, 'close');
    };
    $scope.toggleSidebar = function () {
        whenExists('ui-sidebar', 'toggle');
        const secondaryID = frappe.get_route_str();
        whenExists('ui-sidebar-' + secondaryID, 'toggle');
    };

    $scope.isOpenSideMenu = function () {
        return $mdSidenav('ui-sidebar').isOpen();
    };


    let screen = {};

    $scope.$watch(function () {
        return $mdMedia('(max-width: 559px)');
    }, function (True) {
        screen['x_small'] = True;
        $scope.screen = screen;
    });

    $scope.$watch(function () {
        return $mdMedia('(min-width: 560px)') && $mdMedia('(max-width: 600px)');
    }, function (True) {
        screen['small'] = True;
        $scope.screen = screen;
    });

    $scope.$watch(function () {
        return $mdMedia('(min-width: 601px)') && $mdMedia('(max-width: 967px)');
    }, function (True) {
        screen['medium'] = True;
        $scope.screen = screen;
    });

    $scope.$watch(function () {
        return $mdMedia('(min-width: 968px)');
    }, function (True) {
        screen['large'] = True;
        $scope.screen = screen;
    });

    $scope.$watch('screen', function (n) {
        console.log(n);
    }, true);


    $scope.angularCompile = function (html) {
        return html && html.trim() ? $compile(html)($scope) : "";
    };

    $scope.getNavDirectionClass = () => {
        if (document.querySelector('body.frappe-rtl')) {
            return "md-sidenav-right";
        }

    };


    $scope.changeToIconButton = () => {
        return $mdMedia('(max-width: 768px)') ? 'md-icon-button' : '';
    };
});

