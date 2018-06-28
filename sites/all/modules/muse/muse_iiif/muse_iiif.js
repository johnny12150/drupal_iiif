// detect mobile
window.checkMobileAndTablet = function () {
    var check = false;
    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

(function ($) {
    $.fn.viewer = function () {
        var isMobile = window.checkMobileAndTablet();
        var viewers = this;
        var virwerArray = [];

        var mouseWheelTip = $('<div id="mouseWheelTip">縮放(ctrl+滾輪)  拖曳(ctrl+左鍵)</div>');
        mouseWheelTip.hide();
        $('body').append($(mouseWheelTip));

        // set up viewer
        // OpenSeadragon.setString("Tooltips.Home", "置中");
        // OpenSeadragon.setString("Tooltips.ZoomOut", "縮小");
        // OpenSeadragon.setString("Tooltips.ZoomIn", "放大");
        // OpenSeadragon.setString("Tooltips.FullPage", "全螢幕");

        console.log(viewers.length);

        for (let index = 0; index < viewers.length; index++) {
            var viewer = $(viewers[index]);

            console.log(viewer);

            // check if viewer is generated
            if (viewer.find(".openseadragon-container").length !== 0) {
                console.log("ignore");
                continue;
            }

            // setting the attribute id to the .iiif-viewer div
            viewer.attr('id', "viewer" + index);

            console.log(viewer.attr('id', "viewer" + index));

            // var iiifViewer;


            // var seadragonViewer = OpenSeadragon({
            //     id: "viewer" + index,
            //     prefixUrl: '/sites/all/libraries/openseadragon/images/',
            //     tileSources: [viewer.attr('data-url') + "/info.json"],
            //     autoHideControls: false,
            //     //showFullPageControl: false,
            // });

            // seadragonViewer.addHandler('full-page', function (event) {


            //     window.setTimeout(function () {
            //         for (let index = 0; index < virwerArray.length; index++) {
            //             virwerArray[index].viewport.goHome(false);
            //         }
            //     }, 200);
            //
            //     // in full screen don't need to block mouse drag and zoom
            //     if (!isMobile) {
            //         event.eventSource.setMouseNavEnabled(event.fullPage);
            //     }
            //
            //     if (!event.fullPage) {
            //         // handle image disappear after exit full screen
            //         var mainCarousel = $('.main-carousel');
            //         var index = mainCarousel.slick('slickCurrentSlide');
            //         // recrate slick
            //         mainCarousel.slick('unslick');
            //         mainCarousel.slick({
            //             infinite: true,
            //             speed: 500,
            //             fade: true,
            //             draggable: false,
            //             dots: true,
            //             responsive: [{
            //                 breakpoint: 767,
            //                 settings: {
            //                     respondTo: 'min',
            //                     infinite: true,
            //                     dots: false
            //                 }
            //             }, ]
            //         });
            //         mainCarousel.slick('slickGoTo', index);
            //     }


            // });
            // virwerArray.push(seadragonViewer);


            // virwerArray.push(iiifViewer);
        }

        // setup keyboard event
        // if (!isMobile) {
        //     virwerArray.forEach(function (seadragonViewer) {
        //         seadragonViewer.setMouseNavEnabled(false);
        //     });
        //
        //     $('body').keyup(function (e) {
        //         virwerArray.forEach(function (seadragonViewer) {
        //             seadragonViewer.setMouseNavEnabled(e.ctrlKey);
        //         });
        //     }).keydown(function (e) {
        //         virwerArray.forEach(function (seadragonViewer) {
        //             seadragonViewer.setMouseNavEnabled(e.ctrlKey);
        //         });
        //     });
        // }

    }
})(jQuery);