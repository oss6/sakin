var main = (function (window, document, $, undefined) {

    var x = {};

    x.init = function () {
        try {
            paginator.create('#articles .post-preview', {
                itemsPerPage: pageSize
            });
        } catch (e) {
            // paginator not defined
        }
    };

    return x;

})(window, document, jQuery);

$(document).ready(main.init);
