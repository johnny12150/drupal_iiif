(function ($) {
    // viewer
    $.fn.work = function () {
        var drupal_uid = Drupal.settings.muse_iiif.userId;
        // console.log('uid: '+drupal_uid);
        var _this = this;

        var wait_check = function (callback) {
            // based on data-url to POST manifest API
            // and API will determine to return an already exist manifest URI
            // 回傳getJSON可以ajax GET 的URI
            // or create a new one then return
            var current_id = _this.attr('id');
            var URI_num = '#' + current_id;
            var URI = $(URI_num).attr('data-url');
            var URI_split = URI.split('/').pop();
            console.log(URI_split);
            var url = 'http://172.16.100.20:3033/api/GET/manifest/check/' + URI_split;
            $.ajax({
                type: 'GET',
                url: url,
                contentType: "application/json",
                crossDomain: true,
                success: function (response) {
                    // console.log('mId: ');
                    // console.log(response);
                    var uri = 'http://172.16.100.20:3033/api/GET/' + response + '/manifest';
                    callback(uri);
                },
                error: function (data) {
                    console.log(data.error);
                }
            });
        };

        // wait for the checking progress
        wait_check(function (manifest_url) {
            //alert('change success');
            // var _this = this;
            var colorArray = ['aqua', 'fuchsia', 'lime', 'maroon', 'navy', 'olive', 'orange', 'purple', 'red', 'silver', 'gray', 'teal', 'white', 'yellow', 'green'];
            var manifest = {};
            var href = window.location.href;
            var manifestarr = URLToArray(href);
            var url = manifestarr['manifest'];
            // _this.attr('id', 'main');
            // var elem = '#main';
            // 為了配合muse_iiif的slick.js
            var current_id = _this.attr('id');
            var id_num = current_id.split('viewer').pop();
            var elem = '#' + current_id;
            var map;
            var viewer_offset;
            var data = GetJSON(manifest_url);
            var zoomtemp;
            // var div = $('<div id ="mapid" class="mapid"></div>');
            var map_selector = '<div id ="mapid' + id_num + '" class="mapid"></div>';
            var map_id = '#mapid' + id_num;
            var div = $(map_selector);
            $(elem).append(div);
            manifest.data = data;
            manifest.element = elem;
            manifest.canvasArray = [];
            manifest.annolist = [];
            // index 為設定起始的頁面(第幾個canvas)
            manifest.index = 1;
            manifest.canvasArray = data.sequences[0].canvases;
            manifest.currenCanvas = manifest.canvasArray[manifest.index - 1];
            manifest.currenRotation = 0;
            manifest.countCreatAnnotation = 0;
            manifest.canvasSize = {height: manifest.currenCanvas.height, width: manifest.currenCanvas.width};
            manifest.leaflet = leafletMap();
            manifest.drawnItems;
            manifest.annoArray;

            /*create leaflet map*/
            function leafletMap() {
                var canvas = manifest.currenCanvas;
                viewer_offset = $(_this).offset();
                // var winSize = {y: $('#mapid')[0].clientHeight, x: $('#mapid')[0].clientWidth};
                var winSize = {y: $(map_id)[0].clientHeight, x: $(map_id)[0].clientWidth};
                let url = canvas.images[0].resource.service['@id'] + '/info.json';
                var data = GetJSON(url);

                manifest.annoArray = [];
                for (zoomtemp = 0; zoomtemp < 18; zoomtemp += 1) {
                    if (Math.max(canvas.height, canvas.width) < 256 * Math.pow(2, zoomtemp)) {
                        break;
                    }
                }
                // console.log("project zoom value:"+zoomtemp);

                var map_num = 'mapid' + id_num;
                // map = L.map('mapid', {
                map = L.map(map_num, {
                    crs: L.CRS.Simple,
                    center: [0, 0],
                    zoom: 18,
                    attributionControl: false, //leaflet logo cancel
                    zoomControl: true,
                    zoomSnap: 0.001
                });

                backgroundLabel();
                clickEventLabel();
                L.tileLayer.iiif(url, {
                    setMaxBounds: true,
                    rotation: manifest.currenRotation
                }).addTo(map);
                manifest.drawnItems = L.featureGroup().addTo(map);
                L.control.layers({}, {'drawlayer': manifest.drawnItems}, {
                    position: 'topleft',//'topleft', 'topright', 'bottomleft' or 'bottomright'
                    collapsed: false
                }).addTo(map);

                if (canvas.otherContent !== undefined) {
                    var otherContent_url = canvas.otherContent[0]['@id'];
                    if ((otherContent_url != 'undefined') && (otherContent_url != "")) {
                        var annotationlist = GetJSON(otherContent_url);
                        annotation(annotationlist.resources);
                    }
                }

                map.addControl(new L.Control.Draw({
                    edit: {
                        featureGroup: manifest.drawnItems,
                        poly: {
                            allowIntersection: false
                        }
                    },
                    draw: {
                        polygon: {
                            allowIntersection: false,
                            showArea: false
                        },
                        polygon: false,
                        rectangle: true,
                        polyline: false,
                        circle: false,
                        marker: false,
                        circlemarker: false
                    }
                }));
                map.on({
                    overlayadd: function (e) {
                        manifest.annoArray.map(function (e) {
                            e.overlay = 'add';
                        });

                    },
                    overlayremove: function (e) {
                        manifest.annoArray.map(function (e) {
                            e.overlay = 'remove';
                        });

                    }
                });
                /*繪圖開始*/
                // add_chose_button();
                add_rotation_button();
                // add_info_button();

                map.on(L.Draw.Event.DRAWSTART, function (event) {
                    var current_cancel = '#annotation_cancel' + id_num;
                    var current_save = '#annotation_save' + id_num;
                    $(document).mousemove(function (event) {
                    });
                    $(current_cancel).unbind("click");
                    $(current_save).unbind("click");
                });
                /*為annotation添增mousemove事件*/
                map.on('mousemove', function (e) {
                    // console.log('viewer ' + id_num);
                    // console.log(e);
                    mousemoveOnMap(e);
                });

                /*繪畫完成，記錄形狀儲存的點與其資訊*/
                map.on(L.Draw.Event.CREATED, function (event) {
                    var current_tinymce = '#confirmOverlay' + id_num;
                    var current_box = '#confirmBox' + id_num;
                    var current_save = '#annotation_save' + id_num;
                    var current_cancel = '#annotation_cancel' + id_num;
                    var layer = event.layer;
                    manifest.drawnItems.addLayer(layer);
                    $(current_tinymce).show();
                    var box = $(current_box);
                    var overlay = $(current_tinymce);

                    if (y + box.height() >= overlay.height()) {
                        if (x + box.width() >= overlay.width()) {
                            box.css('left', x - box.width());
                            box.css('top', y - box.height());
                        } else {
                            box.css('left', x);
                            box.css('top', y - box.height());
                        }
                    } else if (x + box.width() >= overlay.width()) {
                        if (y + box.height() >= overlay.height()) {
                            box.css('left', x - box.width());
                            box.css('top', y - box.height());
                        } else {
                            box.css('left', x - box.width());
                            box.css('top', y);
                        }
                    } else {
                        $(current_box)
                            .css('left', x)
                            .css('top', y);
                    }

                    $(current_save).click(function (e) {
                        manifest.countCreatAnnotation++;
                        var chars = formateStr(tinyMCE.activeEditor.getContent());
                        console.log('chars:' + chars);
                        var zoom = manifest.leaflet.getZoom();
                        var point = strToPoint([layer._pxBounds.min.x, layer._pxBounds.min.y, layer._pxBounds.max.x - layer._pxBounds.min.x, layer._pxBounds.max.y - layer._pxBounds.min.y]);

                        var annoData = {
                            'bounds': layer.getBounds(),
                            'point': {'min': layer._latlngs[0][1], 'max': layer._latlngs[0][3]},
                            'metadata': '',
                            'chars': chars,
                            '_leaflet_id': layer._leaflet_id,
                            'preMouseStatus': '',
                            'color': colorArray[layer._leaflet_id % 15],
                            'area': (layer._latlngs[0][3].lat * layer._latlngs[0][3].lat - layer._latlngs[0][1].lat * layer._latlngs[0][1].lat) * (layer._latlngs[0][3].lng * layer._latlngs[0][3].lng - layer._latlngs[0][1].lng * layer._latlngs[0][1].lng),
                            'target': '',
                            'overlay': 'add',
                            'exist': true
                        };

                        // console.log(point);
                        // console.log(annoData.point);
                        //
                        // console.log("anno created");
                        // console.log(annoData);

                        manifest.drawnItems.addLayer(layer);
                        // annoArray會根據 leaflet_id 把資料放進去
                        // manifest.annoArray[layer._leaflet_id] = annoData;
                        // layer._path.id = layer._leaflet_id;
                        // labelBinding(layer, chars);
                        // 處理on 的xywh
                        // 做anno 座標edit的話 可能也需要
                        var p = convert_latlng_SVG(annoData.point);
                        var xywh = formatFloat(p[0].x, 2) + ',' + formatFloat(p[0].y, 2) + ',' + formatFloat((p[1].x - p[0].x), 2) + ',' + formatFloat((p[1].y - p[0].y), 2);
                        console.log([layer._pxBounds.min.x, layer._pxBounds.min.y, layer._pxBounds.max.x - layer._pxBounds.min.x, layer._pxBounds.max.y - layer._pxBounds.min.y]);
                        console.log(xywh);
                        var json = {
                            "@id": "default",
                            "@type": "oa:Annotation",
                            "motivation": "sc:painting",
                            "metadata": [],
                            "resource": {
                                "@id": "https://cyberisland.teldap.tw/album/zHxo/annotation/body_mmNltghrjZwmgrmTIbelETIkeYjSihbw_0",
                                "@type": "dctypes:Text",
                                "format": "text/plain",
                                "chars": chars,
                                "language": navigator.language
                            },
                            "on": manifest.currenCanvas["@id"] + "#xywh=" + xywh
                        };
                        // console.log(json);
                        console.log("anno create count:" + manifest.countCreatAnnotation);
                        var c_index = manifest.index - 1;
                        console.log("canvas_index: " + c_index);

                        console.log("---------------------------------------------------------------------");
                        console.log("mId :" + JSON.stringify(manifest.data));
                        console.log("mId :" + manifest.data.mId);


                        // var url = 'http://172.16.100.20:3033/api/POST/anno/mongo';
                        var url_mysql = 'http://172.16.100.20:3033/api/POST/anno/mysql';
                        var new_anno_index;

                        // ajax to save anno
                        $.ajax({
                            type: 'POST',
                            url: url_mysql,
                            contentType: "application/json",
                            dataType: "json",
                            crossDomain: true,
                            data:
                                JSON.stringify({
                                    anno_data: json.resource.chars,
                                    anno_place: json.on,
                                    other_content: canvas.otherContent[0]['@id'],
                                    mId: manifest.data.mId,
                                    canvas_index: c_index,
                                    uId: drupal_uid // for verify in APIs
                                }), //passing data to server
                            success: function (response) {
                                var res_data = response;
                                console.log(res_data);
                                // 當manifest的othercontent URL沒有被更新(存在同個註記)
                                if (res_data.text == 'add new one') {
                                    console.log("no need to update otherContent url");
                                    console.log(res_data.resources_id);
                                    manifest.annoArray[layer._leaflet_id] = annoData;
                                    new_anno_index = res_data.num;
                                    manifest.annoArray[layer._leaflet_id].anno_index = new_anno_index;
                                    json.resource['@id'] = res_data.resources_id;
                                    json.anno_index = new_anno_index;
                                    // 取代原本 @id 是 default
                                    json['@id'] = canvas.otherContent[0]['@id'];
                                    manifest.annolist.push(json);
                                    layer._path.id = layer._leaflet_id;
                                    labelBinding(layer, chars);
                                }
                                else if (text.text == 'things go sideways' || text.text == 'not an auth action') {
                                    // console.log(text.text);
                                    alert("You don't have the permission to create an annotation.");
                                    manifest.drawnItems.removeLayer(layer);
                                }// 當manifest的othercontent URL被更新
                                else {
                                    console.log("updated otherContent Url: " + res_data.text);
                                    manifest.annoArray[layer._leaflet_id] = annoData;
                                    canvas.otherContent[0]['@id'] = res_data.text;
                                    new_anno_index = res_data.num;
                                    manifest.annoArray[layer._leaflet_id].anno_index = new_anno_index;
                                    json.resource['@id'] = res_data.resources_id;
                                    json.anno_index = new_anno_index;
                                    json['@id'] = canvas.otherContent[0]['@id'];
                                    manifest.annolist.push(json);
                                    layer._path.id = layer._leaflet_id;
                                    labelBinding(layer, chars);
                                }
                            },
                            error: function (data) {
                                console.log(json.error);
                            }
                        });


                        $(current_tinymce).hide();
                        tinyMCE.activeEditor.setContent('');

                    });
                    $(current_cancel).click(function (e) {
                        manifest.drawnItems.removeLayer(layer);
                        tinyMCE.activeEditor.setContent('');
                        $(current_tinymce).hide();
                    });

                });
                // 註解位置update
                map.on('draw:edited', function (e) {
                    var layers = e.layers;
                    var new_On_Url;
                    var edit_resources_id_index;
                    layers.eachLayer(function (layer) {
                        manifest.annoArray.map(function (anno) {
                            if (anno._leaflet_id == layer._leaflet_id) {
                                manifest.annoArray[anno._leaflet_id].bounds = layer.getBounds();
                                var point = {
                                    min: {lat: layer._bounds._northEast.lat, lng: layer._bounds._southWest.lng},
                                    max: {lat: layer._bounds._southWest.lat, lng: layer._bounds._northEast.lng}
                                };
                                manifest.annoArray[anno._leaflet_id].point = point;
                                manifest.annoArray[anno._leaflet_id].area = (point.max.lat * point.max.lat - point.min.lat * point.min.lat) * (point.max.lng * point.max.lng - point.min.lng * point.min.lng);
                                console.log("edited annotation info");
                                console.log(manifest.annoArray[anno._leaflet_id]);
                                edit_resources_id_index = manifest.annoArray[anno._leaflet_id].anno_index;

                                // 處理xywh 後把他加到on 的URL 並update到 anno 資料庫
                                var p = convert_latlng_SVG(manifest.annoArray[anno._leaflet_id].point);
                                var xywh = formatFloat(p[0].x, 2) + ',' + formatFloat(p[0].y, 2) + ',' + formatFloat((p[1].x - p[0].x), 2) + ',' + formatFloat((p[1].y - p[0].y), 2);
                                console.log("after edit: " + xywh);
                                new_On_Url = manifest.currenCanvas["@id"] + "#xywh=" + xywh;
                                console.log("新的註記位置URL: " + new_On_Url);
                            }
                        });
                        //do whatever you want; most likely save back to db
                        // 透過index 來取得resources的@id
                        // var edit_resources_id = manifest.annolist.find(x => x.anno_index === edit_resources_id_index)['@id'];
                        var found = $.grep(manifest.annolist, function (x) {
                            return x.anno_index === edit_resources_id_index;
                        });
                        // console.log("jquery array find: "+JSON.stringify(found[0]));
                        var edit_resources_id = found[0]["@id"];
                        console.log("被更新的註記的resources @id: " + edit_resources_id);

                        // 處理一下要給過去的anno id
                        // 直接用第一個annolist的是因為同一筆的annoId都一樣
                        var pass_aId = manifest.annolist[0]['@id'].split("body_").pop();
                        var the_aId = pass_aId.split("_");

                        // fetch to save the change of OnUrl
                        // var updateOn_url = 'http://172.16.100.20:3033/api/PUT/anno/mongo';
                        // mysql version url
                        var updateOn_url_mysql = 'http://172.16.100.20:3033/api/PUT/anno/on/mysql';

                        $.ajax({
                            type: 'PUT',
                            url: updateOn_url_mysql,
                            contentType: "application/json",
                            crossDomain: true,
                            data:
                                JSON.stringify({
                                    OnUrl: new_On_Url,
                                    anno_source_id: edit_resources_id,
                                    aId: the_aId[0],
                                    uId: drupal_uid // for verify in APIs
                                    // todo: making sure anno API using uId to do Auth
                                }), //passing data to server
                            success: function (response) {
                                console.log("server端response: " + response);
                            },
                            error: function (data) {
                                console.log(data.error);
                            }
                        });
                    });
                });
                map.on('draw:deleted', function (e) {
                    var anno_that_got_deleted;
                    var layers = e.layers;
                    layers.eachLayer(function (layer) {
                        manifest.annoArray.map(function (anno) {
                            if (anno._leaflet_id == layer._leaflet_id) {
                                console.log("delete annotation info");
                                console.log(manifest.annoArray[anno._leaflet_id]);
                                // 要被刪除的註記的index
                                anno_that_got_deleted = manifest.annoArray[anno._leaflet_id].anno_index;
                                console.log("要被刪除的註記的index: " + anno_that_got_deleted);
                                // console.log(layer);

                                manifest.annoArray[anno._leaflet_id].exist = false;
                            }
                        });

                        // var delete_data_source_id = manifest.annolist.find(x => x.anno_index === anno_that_got_deleted).resource['@id'];
                        var found = $.grep(manifest.annolist, function (x) {
                            return x.anno_index === anno_that_got_deleted;
                        });
                        // console.log("jquery array find: "+JSON.stringify(found[0]));
                        var delete_data_source_id = found[0].resource["@id"];
                        console.log("被刪除的註記的source @id : " + delete_data_source_id);

                        // 處理一下要給過去的anno id
                        // 直接用第一個annolist的是因為同一筆的annoId都一樣
                        var pass_aId = manifest.annolist[0]['@id'].split("body_").pop();
                        var the_aId = pass_aId.split("_");

                        // fetch 要刪除的資訊到anno API
                        // var delete_url = 'http://172.16.100.20:3033/api/DELETE/anno/mongo';
                        var delete_url_mysql = 'http://172.16.100.20:3033/api/DELETE/anno/mysql';
                        $.ajax({
                            type: 'DELETE',
                            url: delete_url_mysql,
                            contentType: "application/json",
                            crossDomain: true,
                            data:
                                JSON.stringify({
                                    resource_id: delete_data_source_id,
                                    aId: the_aId[0],
                                    uId: drupal_uid // for verify in APIs
                                    // todo: making sure anno API using uId to do Auth
                                }), //passing data to server
                            success: function (response) {
                                console.log("server端response: " + response);
                            },
                            error: function (data) {
                                console.log(data.error);
                            }
                        });
                    });
                });
                map.on('click', function (event) {
                    var latLng = event.latlng;
                    var anno_latLng_array_IDs = [];
                    annoMousemove(latLng, anno_latLng_array_IDs, 'click');
                });

                ctrl_zoom();
                // console.log('viewer' + id_num);
                // console.log(JSON.stringify(manifest.annoArray));
                return map;
            }

            function mousemoveOnMap(e) {
                var click = '#clickEventLabel' + id_num;
                var outer = click + ' .annoClickOuter';
                // $('.annoClickOuter').hide();
                $(outer).hide();
                $(click).hide();
                var anno_latLng_array_IDs = [];
                annoMousemove(e.latlng, anno_latLng_array_IDs);
                annoShowByArea(manifest.annoArray);
                backgroundLabelSwitch(anno_latLng_array_IDs.length);
                LabelPosition(map.latLngToContainerPoint(e.latlng));
            }

            function formatFloat(num, pos) {
                var size = Math.pow(10, pos);
                return Math.round(num * size) / size;
            }

            /**將經緯度轉成正常的pixel*/
            function convert_latlng_SVG(points) {
                var array = [];
                $.each(points, function (i, value) {
                    var temp = manifest.leaflet.project(value, zoomtemp);
                    temp.x = temp.x * 100 / 100;
                    temp.y = temp.y * 100 / 100;
                    array.push(temp);
                });
                return array;
            }

            function backgroundLabelSwitch(l) {
                var background_id = '#backgroundLabel' + id_num;
                if (l != 0) {
                    // todo: can't find labelClose anywhere, may need to remove inside of css too
                    // $('#labelClose').click(function () {
                    //     $(background_id).hide();
                    // });
                    $(background_id).show();
                } else {
                    $(background_id).hide();
                }
            }

            /*annotation*/
            function annotation(resources) {
                $.each(resources, function (i, value) {
                    // 為了避免以後編輯註記跟刪除會有問題
                    // 多存個可以判定是哪個註記的 anno_id 到annolist
                    // ex: 取@id 最後面的num
                    var anno_sid = value['@id'];
                    // console.log(value['@id']);
                    var anno_cut = anno_sid.split("_").pop();
                    var anno_index = anno_cut.split("_").pop();
                    // 從string 轉成int
                    var index = parseInt(anno_index);
                    // 將anno的index 放到value 這個物件裡
                    value.anno_index = index;

                    manifest.annolist.push(value);
                    // console.log(JSON.stringify(manifest.annolist));

                    var layer, shape;
                    shape = 'rectangle';
                    var point = strToPoint(/xywh=(.*)/.exec(value.on)[1].split(','));
                    var chars = formateStr(value.resource.chars);

                    var metadata = value.metadata;
                    var area = (point.max.lat * point.max.lat - point.min.lat * point.min.lat) * (point.max.lng * point.max.lng - point.min.lng * point.min.lng);
                    var padding = 0.5;
                    manifest.annoArray.forEach(function (val) {
                        if (point.min.lat == val.point.min.lat && point.min.lng == val.point.min.lng && point.max.lat == val.point.max.lat && point.max.lng == val.point.max.lng) {
                            point.min.lat -= padding;
                            point.min.lng += padding;
                            point.max.lat -= padding;
                            point.max.lng += padding;
                        }
                    });
                    var latLng = L.latLngBounds(point.min, point.max);
                    layer = L.rectangle(latLng);
                    manifest.drawnItems.addLayer(layer);
                    var mapId = '#mapid' + id_num;
                    // console.log($(mapId).children().children()[2]);
                    var certain_path = $(mapId).children().children().children().children().children('path');

                    // https://stackoverflow.com/questions/18016766/jquery-select-child-element-by-class-with-unknown-path
                    // alternative (better) way to do so
                    var find_path = $(mapId).find('path');
                    console.log(find_path);
                    console.log(certain_path);

                    // $('path')[$('path').length - 1].id = layer._leaflet_id;

                    // this line only works for single anno in a viewer
                    // certain_path.attr('id', layer._leaflet_id);

                    $(certain_path)[$(certain_path).length - 1].id = layer._leaflet_id;
                    // $(find_path)[$(find_path).length - 1].id = layer._leaflet_id;

                    // console.log($(certain_path));
                    // console.log($(certain_path).length);
                    // console.log($(certain_path)[$(certain_path).length - 1]);

                    labelBinding(layer, chars, value);

                    var annoData = {
                        'bounds': layer.getBounds(),
                        'point': point,
                        'metadata': value.metadata,
                        'chars': chars,
                        '_leaflet_id': layer._leaflet_id,
                        'preMouseStatus': '',
                        'color': colorArray[layer._leaflet_id % 15],
                        'area': area,
                        'target': '',
                        'overlay': 'add',
                        'exist': true,
                        // 把自己給定的anno_index也放到annoArray裡方便之後對應是哪筆註記
                        'anno_index': value.anno_index
                    };
                    manifest.annoArray[layer._leaflet_id] = annoData;
                });
            }

            function labelBinding(layer, chars, value) {
                var titleChars = titlize(chars);
                var htmlTag = '<div id="anno' + layer._leaflet_id + '" class="tipbox"><a class="tip" style="background-color:' + colorArray[layer._leaflet_id % 15] + ';"></a><a class="tipTitle">' + titleChars + '</a></div>';
                var annolabel = $(htmlTag);
                // console.log(htmlTag);
                // append fail when i try to use it on muse (D7)
                // alternative solution:
                // https://stackoverflow.com/questions/3636401/jquery-append-to-multiple-elements-fails

                var background_id = '#backgroundLabel' + id_num;
                // $('#backgroundLabel').append(annolabel);
                annolabel.appendTo(background_id);

                var annoClickStr = '<div id="annoClick' + layer._leaflet_id + '" class="annoClickOuter"><div class="blankLine"></div>' +
                    '<div class="annoClickInnerUp" style="background-color:' + colorArray[layer._leaflet_id % 15] + ';"></div>' +
                    '<div class="annoClickInnerDown">' +
                    '<div class="annoClickChars' + id_num + '">' + chars + '</div>' +
                    '<div class="annoClickMetadata">' + ((value) ? value.metadata[0].value : '') + '</div>' +
                    '<div class="annoClickMetadata">' + ((value) ? value.metadata[1].value[1]['@value'] : '') + '</div>' +
                    '</div>' +
                    '</div>';
                var clickEventPane = $(annoClickStr);
                var clickEvent_id = '#clickEventLabel' + id_num;
                $(clickEvent_id).append(clickEventPane);
                // $('#clickEventLabel').append(clickEventPane);

                $('#anno' + layer._leaflet_id).click(function () {
                    console.log('current anno ' + layer._leaflet_id); // works fine
                    annoLableClick(manifest.annoArray[layer._leaflet_id]);
                });
            }

            var chars = ".annoClickChars" + id_num;
            // $(".annoClickChars").dblclick(function (e) {
            $(chars).dblclick(function (e) {
                e.preventDefault();
                // disable leaflet map mousemove
                map.off('mousemove');

                // console.log(map);

                $(chars).unbind('dblclick');
                textEditorOnDblclick(e);
            });

            // called when label is double clicked
            function textEditorOnDblclick(e) {
                var newEditor = '#newTextEditor' + id_num;
                var clicklabel_num = e.target.parentElement.parentElement.parentElement.id.split('clickEventLabel').pop();
                // 根據id讓特定viewer處理編輯註記
                if (clicklabel_num == id_num) {
                    let oldText = e.target.innerText;
                    // console.log('clicklabel id: '+ e.target.parentElement.parentElement.parentElement.id);
                    // console.log('clicklabel num: '+ clicklabel_num);

                    $(e.target).empty();
                    var editor = $('<textarea class="newTextEditor" id="newTextEditor' + id_num + '" rows="2" cols="24">' + oldText + '</textarea>');
                    console.log('editor in viewer' + id_num);
                    console.log("oldText: " + oldText);

                    $(e.target).append(editor);
                    // auto focus
                    $(newEditor).focus();
                    // handle ESC
                    $(newEditor).keyup(function (e) {
                        if (e.keyCode === 27) {
                            // when hitting ESC then hide the label
                            // var click = '#clickEventLabel' + id_num;
                            // fix - multi viewer的註記顯示怪怪，可以參考原本的api.js
                            // $('.annoClickOuter').hide();
                            // $('.annoClickChars').hide();
                            // $(click).hide();
                            var myNode = e.target.parentElement;
                            console.log(myNode);
                            console.log(myNode.firstChild);
                            while (myNode.firstChild) {
                                myNode.removeChild(myNode.firstChild);
                            }
                            myNode.innerHTML = oldText;
                            console.log('after adding text: ' + myNode);
                            // enable leaflet map mousemove
                            map.on('mousemove', function (e) {
                                // console.log(e);
                                mousemoveOnMap(e);
                            });

                        }
                    });
                    $(newEditor).keypress(function (e) {
                        process(e, this);
                    });
                }
            }

            // 處理雙擊label後的編輯註記
            function process(e) {
                var code = (e.keyCode ? e.keyCode : e.which);
                if (code == 13) { //Enter keycode
                    var annoid = e.target.parentElement.parentElement.parentElement.id;
                    var newText = e.target.value;
                    var myNode = e.target.parentElement;
                    // while (myNode.firstChild) {
                    //     myNode.removeChild(myNode.firstChild);
                    // }
                    // myNode.innerHTML = newText;

                    // 這個annoid就是 _leaflet_id
                    annoid = annoid.replace(/[A-Z]|[a-z]/g, "");
                    // 取舊的chars
                    console.log("old anno: " + document.getElementById("anno" + annoid).children[1].text);
                    var old_anno = document.getElementById("anno" + annoid).children[1].text;

                    // document.getElementById("anno" + annoid).children[1].text = newText;
                    // map.on('mousemove', function (e) {
                    //     mousemoveOnMap(e)
                    // });

                    // 按下enter可以結束編輯
                    // 修改註記的後端動作放以下
                    // newText 是修改後取得新的text方式
                    console.log("_leaflet_id " + annoid);
                    console.log("new anno text: " + newText);
                    // 嘗試與annoArray連接

                    console.log('update in viewer' + id_num);
                    console.log(JSON.stringify(manifest.annoArray));

                    // 修改的註記的index
                    var source_id_index;
                    manifest.annoArray.map(function (anno) {
                        if (anno._leaflet_id == annoid) {
                            console.log("修改的anno的index: " + manifest.annoArray[anno._leaflet_id].anno_index);
                            source_id_index = manifest.annoArray[anno._leaflet_id].anno_index;
                        }
                    });

                    // source_id_prefix = manifest.annolist.find(x => x.anno_index === source_id_index).resource['@id'];
                    var found = $.grep(manifest.annolist, function (x) {
                        return x.anno_index === source_id_index;
                    });
                    // console.log("jquery array find: "+JSON.stringify(found[0]));
                    var source_id_prefix = found[0].resource['@id'];

                    // fetch to update
                    var cut_id = source_id_prefix.split("body_").pop();
                    var anno_objID = cut_id.split("_");
                    // anno_objID[0]才是 註記的obj ID
                    var update_url = "http://172.16.100.20:3033/api/PUT/anno/mongo/" + anno_objID[0];
                    var update_url_mysql = "http://172.16.100.20:3033/api/PUT/anno/mysql/" + anno_objID[0];
                    // fetch(update_url_mysql, {
                    //     method: "PUT",
                    //     headers: {
                    //         'Accept': 'application/json, text/plain, */*',
                    //         'Content-Type': 'application/json'
                    //     },
                    //     body: JSON.stringify({
                    //         resource_id: source_id_prefix,
                    //         text: newText
                    //     })
                    // })
                    //     .then(function(response) {
                    //         //處理 response
                    //         //console.log('fetch to save anno is done !');
                    //         //console.log(response);
                    //     }).catch(function(err) {
                    //     // Error :(
                    //     console.log(err);
                    // })
                    // end of fetch

                    $.ajax({
                        type: 'PUT',
                        url: update_url_mysql,
                        contentType: "application/json",
                        crossDomain: true,
                        data:
                            JSON.stringify({
                                resource_id: source_id_prefix,
                                text: newText,
                                uId: drupal_uid // for verify in APIs
                            }), //passing data to server
                        success: function (response) {
                            var text = response.text();
                            console.log("server端response: " + response);
                            //處理認證不過收到'things go sideways'時的註記label顯示
                            if (text == 'things go sideways' || text == 'not an auth action') {
                                alert('Something going wrong, failed to update the annotation.');
                                // todo: fix - multi viewer的註記顯示怪怪，可以參考原本的api.js
                                while (myNode.firstChild) {
                                    myNode.removeChild(myNode.firstChild);
                                }
                                myNode.innerHTML = old_anno;
                                map.on('mousemove', function (e) {
                                    mousemoveOnMap(e);
                                });
                            }
                            else {
                                while (myNode.firstChild) {
                                    myNode.removeChild(myNode.firstChild);
                                }
                                myNode.innerHTML = newText;
                                document.getElementById("anno" + annoid).children[1].text = newText;
                                map.on('mousemove', function (e) {
                                    mousemoveOnMap(e)
                                });
                            }
                        },
                        error: function (data) {
                            console.log(data.error);
                        }
                    });

                }
            }

            /*str to rotation point*/
            function strToPoint(str) {
                var canvasSize = manifest.canvasSize
                var rotation = manifest.currenRotation;
                var minPoint = L.point(str[0], str[1]);
                var maxPoint = L.point(parseInt(str[0]) + parseInt(str[2]), parseInt(str[1]) + parseInt(str[3]));
                var x = minPoint.x, y = minPoint.y;
                switch (rotation) {
                    case 0:
                        break;
                    case 90:
                        minPoint.x = canvasSize.height - maxPoint.y;
                        minPoint.y = maxPoint.x;
                        maxPoint.x = canvasSize.height - y;
                        maxPoint.y = x;
                        break;
                    case 180:
                        minPoint.x = canvasSize.width - maxPoint.x;
                        minPoint.y = canvasSize.height - maxPoint.y;
                        maxPoint.x = canvasSize.width - x;
                        maxPoint.y = canvasSize.height - y;
                        break;
                    case 270:
                        minPoint.x = maxPoint.y;
                        minPoint.y = canvasSize.width - maxPoint.x;
                        maxPoint.x = y;
                        maxPoint.y = canvasSize.width - x;
                        break;
                }

                var min = map.unproject(minPoint, zoomtemp);
                var max = map.unproject(maxPoint, zoomtemp);
                var point = {'min': min, 'max': max};
                return point;
            }

            /*RegEx url to array*/
            function URLToArray(url) {
                var request = {};
                var pairs = url.substring(url.indexOf('?') + 1).split('&');
                for (var i = 0; i < pairs.length; i++) {
                    if (!pairs[i])
                        continue;
                    var pair = pairs[i].split('=');
                    request[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
                }
                return request;
            }

            /*change page function*/
            function change() {
                //  leaflet remove 似乎與Uncaught TypeError: Cannot read property '_leaflet_pos' of undefined 錯誤有關
                manifest.leaflet.remove();
                // 換頁功能也正常 但跟上面的remove有一樣的錯誤訊息
                // map.remove();

                manifest.currenCanvas = manifest.canvasArray[manifest.index - 1];
                manifest.leaflet = leafletMap();
            }

            function add_rotation_button() {
                var div = $('<div class= "leaflet-control-layers leaflet-control" style="padding-top: 5px;"></div>');
                var reset = $('<div class="leaflet-control-layers-base reset canvasBtn" aria-hidden="true"><span class="fa fa-home fa-2x"></span></div>');
                var rotationL = $('<div class="leaflet-control-layers-base rotation canvasBtn" aria-hidden="true"><span class="fa fa-undo fa-2x"  value="270"></span></div>');
                var rotationR = $('<div class="leaflet-control-layers-base rotation canvasBtn" aria-hidden="true"><span class="fa fa-repeat fa-2x" value="90" ></span></div>');
                var separatorL = $('<div class="vertical_separator" ></div>');
                var separatorR = $('<div class="vertical_separator"></div>');
                div.append(rotationL, separatorL, reset, separatorR, rotationR);
                var leaflet_ctrl = '#mapid' + id_num + ' .leaflet-control-container .leaflet-top.leaflet-left';
                // $($('.leaflet-control-container.leaflet-top.leaflet-left')[0]).prepend(div);
                $($(leaflet_ctrl)[0]).prepend(div);
                $('.reset').click(function () {
                    manifest.leaflet.remove();
                    manifest.currenRotation = 0;
                    manifest.leaflet = leafletMap();
                });
                $('.rotation').click(function (e) {
                    manifest.leaflet.remove();
                    manifest.currenRotation += parseInt(e.target.getAttribute("value"));
                    manifest.currenRotation = (manifest.currenRotation >= 360) ? manifest.currenRotation - 360 : manifest.currenRotation;
                    console.log(manifest.currenRotation);
                    manifest.leaflet = leafletMap();
                });
            }

            /*page change right/left button*/
            function add_chose_button() {
                var div = $('<div class= "leaflet-control-layers leaflet-control" style="padding-top: 5px;"></div>');
                var left = $('<div class="leaflet-control-layers-base canvasBtn" ><span class="fa fa-chevron-left fa-2x" aria-hidden="true"> </span></div>');
                var input = $('<div class="leaflet-control-layers-base canvasPage"><span></span></div>');
                var right = $('<div class="leaflet-control-layers-base canvasBtn" ><span class="fa fa-chevron-right fa-2x" aria-hidden="true"> </span></div>');
                var separatorL = $('<div class="vertical_separator" ></div>');
                var separatorR = $('<div class="vertical_separator"></div>');
                div.append(left, separatorL, input, separatorR, right);
                $($('.leaflet-bottom.leaflet-right')[0]).prepend(div);
                $($(input)[0]).html(manifest.index + '/' + manifest.canvasArray.length);
                right.click(function (e) {
                    elemid = e.target.parentElement.parentElement.id;
                    if (manifest.index + 1 <= manifest.canvasArray.length) {
                        manifest.index = manifest.index + 1;
                        change();
                        if (manifest.leftclick == false) {
                            manifest.leftclick = true;
                            left.show();
                        }
                    } else {
                        alert('Out of Range');
                        right.hide();
                        manifest.rightclick = false;
                    }

                });
                left.click(function (e) {
                    elemid = e.target.parentElement.parentElement.id;
                    if (manifest.index - 1 >= 1) {
                        manifest.index = manifest.index - 1;
                        change();
                        if (manifest.rightclick == false) {
                            manifest.rightclick = true;
                            right.show();
                        }

                    } else {
                        alert('Out of Range');
                        left.hide();
                        manifest.leftclick = false;
                    }
                });

            }

            /*get json by url*/
            function GetJSON(url) {
                var data;
                $.ajax({
                    url: url,
                    method: "GET",
                    async: false,
                    dataType: "JSON",
                    success: function (response) {
                        // console.log(response);
                        data = response;
                    },
                    error: function (xhr, status, error) {
                        console.log("xhr:" + xhr + '\n' + "status:" + status + '\n' + "error:" + error);
                    }
                });
                return data;
            }

            /* rotation for mouse moving   */
            function enterorleave(latLng, i) {
                if (manifest.currenRotation == 0 || manifest.currenRotation == 180) {
                    return (latLng.lat < manifest.annoArray[i].point.min.lat) && (latLng.lat > manifest.annoArray[i].point.max.lat)
                        && (latLng.lng > manifest.annoArray[i].point.min.lng) && (latLng.lng < manifest.annoArray[i].point.max.lng);
                } else if (manifest.currenRotation == 90) {
                    return (latLng.lat > manifest.annoArray[i].point.min.lat) && (latLng.lat < manifest.annoArray[i].point.max.lat)
                        && (latLng.lng > manifest.annoArray[i].point.min.lng) && (latLng.lng < manifest.annoArray[i].point.max.lng);
                } else if (manifest.currenRotation == 270) {
                    return (latLng.lat < manifest.annoArray[i].point.min.lat) && (latLng.lat > manifest.annoArray[i].point.max.lat)
                        && (latLng.lng < manifest.annoArray[i].point.min.lng) && (latLng.lng > manifest.annoArray[i].point.max.lng);
                }
            }

            /*check mouse on annotation*/
            function annoMousemove(latLng, anno_latLng_array_IDs, clicked) {
                // console.log('annoMousemove active');
                manifest.annoArray.map(function (anno) {
                    if (anno) {
                        var i = anno._leaflet_id;
                        //console.log(latLng);
                        if (enterorleave(latLng, i)) {

                            if (manifest.annoArray[i].preMouseStatus != 'mouseenter') {
                                manifest.annoArray[i].preMouseStatus = 'mouseenter';

                                // console.log("現在指標指到_leaflet_id 為 "+ i + " 的註記");
                                // console.log("指到的註記的annoArray為 "+ JSON.stringify(manifest.annoArray[i]));
                                // console.log("指到的註記的index為 "+ manifest.annoArray[i].anno_index);
                                // console.log("整個annoArray為 "+ JSON.stringify(manifest.annoArray));
                            }
                            if (clicked == 'click' && manifest.annoArray[i].target == 'target') {
                                var background_id = '#backgroundLabel' + id_num;
                                $(background_id).hide();
                                $(background_id).show();
                                $('#annoClick' + manifest.annoArray[i]._leaflet_id).show();
                                // console.log("anno clicked");
                                console.log(manifest.annoArray[i]); //works fine
                            }
                            anno_latLng_array_IDs.push(i);

                        } else {
                            if (manifest.annoArray[i].preMouseStatus != 'mouseleave') {
                                manifest.annoArray[i].preMouseStatus = 'mouseleave';
                            }
                        }
                    }

                });
            }

            /**backgroundLabel*/
            function backgroundLabel() {
                var background_id = '#backgroundLabel' + id_num;
                // $('#backgroundLabel').remove();
                $(background_id).remove();
                var background_div = '<div id = "backgroundLabel' + id_num + '" class="backgroundLabel"></div>';
                // var backgroundLabel = $('<div id = "backgroundLabel" ></div>');
                var backgroundLabel = $(background_div);
                $('body').append(backgroundLabel);
                $(background_id).hide();
            }

            function clickEventLabel() {
                var clickEvent_id = '#clickEventLabel' + id_num;
                // $('#clickEventLabel').remove();
                $(clickEvent_id).remove();
                var clickEventLabel = $('<div id = "clickEventLabel' + id_num + '" class="clickEventLabel"></div>');
                $('body').append(clickEventLabel);
                $(clickEvent_id).hide();

                // var clickEventLabel = $('<div id = "clickEventLabel" ></div>');
                // $('body').append(clickEventLabel);
                // $('#clickEventLabel').hide();
            }

            function annoShowByArea(arr) {
                var array = [];
                var prems = '';
                manifest.annoArray.map(function (anno) {
                    var i = anno._leaflet_id;
                    prems = arr[i].preMouseStatus;
                    if (prems == 'mouseenter') {
                        array.push(arr[i]);
                    }
                });

                var elem = (manifest.currenRotation == 90 || manifest.currenRotation == 270) ? Math.max.apply(Math, array.map(function (o) {
                    return o.area;
                })) : Math.min.apply(Math, array.map(function (o) {
                    return o.area;
                }));
                var minelem;
                array.forEach(function (e) {
                    if (e.area == elem) {
                        minelem = e;
                    }
                });
                manifest.annoArray.map(function (anno) {
                    var i = anno._leaflet_id;
                    $('#anno' + i).hide();
                    manifest.annoArray[i].target = '';
                    d3.select($('path#' + i)[0])
                        .transition()
                        .duration(350)
                        .attr({
                            stroke: '#3388ff'
                        })
                });
                manifest.annoArray.map(function (anno) {
                    var i = anno._leaflet_id;
                    if (typeof minelem != 'undefined') {
                        if (minelem.area == arr[i].area && minelem.overlay == 'add' && minelem.exist) {
                            $('#anno' + i).show();
                            d3.select($('path#' + i)[0])
                                .transition()
                                .duration(100)
                                .attr({
                                    stroke: arr[i].color
                                })
                            manifest.annoArray[i].target = 'target';
                        }
                    }
                });

            }

            /*show manifest info button*/
            function add_info_button() {
                var data1 = manifest.data;
                var metadata = data1.metadata;
                var p;
                for (let index = 0; index < metadata.length; index++) {
                    const val = metadata[index];
                    if (typeof val.value == 'object') {
                        for (let index = 0; index < val.value.length; index++) {
                            const lan = val.value[index];
                            if (lan['@language'] == window.navigator.language) {
                                p = lan['@value'];
                            }
                        }
                    }
                }
                manifest.id = manifest.data['@id'];

                // console.log("manifest");
                // to log object, must contain only object
                // https://stackoverflow.com/questions/957537/how-can-i-display-a-javascript-object
                // console.log(manifest);

                var div = $('<div class="leaflet-control-layers leaflet-control "></div>');
                var icon = $('<i id="infoBtn" class="fa fa-info-circle fa-3x" aria-hidden="true"></i>');
                icon.click(function () {
                    $('#info').show();
                    map.scrollWheelZoom.disable();
                    icon.hide();
                });
                var info = $('<div id="info" class="list-group">' +
                    '<div class="scrollbar" id="style-1"><div class="force-overflow">' +
                    '<span id="infoClose" > X </span>' +
                    '<dl><dt>manifest URI</dt><dd><a href="' + manifest.id + '">' + manifest.id + '</a></dd></dl>' +
                    '<dl><dt>Label</dt><dd>' + data1.label + '</dd></dl>' +
                    '<dl><dt>Description</dt><dd>' + data1.description + '</dd></dl>' + '<dl><dt>Attribution</dt><dd>' + data1.attribution + '</dd></dl>' +
                    '<dl><dt>License</dt><dd>' + data1.license + '</dd></dl>' +
                    '<dl><dt>Logo</dt><dd>' + data1.logo['@id'] + '</dd></dl>' +
                    '<dl><dt>Viewing Direction</dt><dd>' + data1.viewingDirection + '</dd></dl>' +
                    '<dl><dt>Viewing Hint</dt><dd>' + data1.viewingHint + '</dd></dl>' +
                    '<dl><dt>' + data1.metadata[0].label + '</dt><dd>' + data1.metadata[0].value + '</dd></dl>' +
                    '<dl><dt>' + data1.metadata[1].label + '</dt><dd>' + p + '</dd></dl>' +
                    '<dl><dt>' + data1.metadata[2].label + '</dt><dd>' + data1.metadata[2].value + '</dd></dl>' +
                    '</div></div>' +
                    '</div>');
                div.append(icon, info);
                $(info[0]).find('a').attr("target", "_parent");
                $($('.leaflet-top.leaflet-right')[0]).prepend(div);
                $('#infoClose').click(function () {
                    $('#info').hide();
                    map.scrollWheelZoom.enable();
                    $("#infoBtn").show();
                });


            }

            /*Label position*/
            function LabelPosition(point) {
                var background = '#backgroundLabel' + id_num;
                var clickEvent = '#clickEventLabel' + id_num;
                x = point.x + viewer_offset.left;
                y = point.y + viewer_offset.top;
                $(background).css({'left': x, 'top': y});
                // $('.backgroundLabel').css({'left': x, 'top': y});
                $(clickEvent).css({'left': x, 'top': y});
                // $('.clickEventLabel').css({'left': x, 'top': y});

            }

            /*formate string to html innerHTML*/
            function formateStr(str) {
                var div = document.createElement("div");
                if (str != null) {
                    div.innerHTML = str;
                }
                if (div.innerText == '')
                    return '無描述';
                return div.innerText;
            }

            /*titlize chars*/
            function titlize(str) {
                if (str == '')
                    return '無描述';

                return str;//str.substring(0, 9) + '...';
            }

            function annoLableClick(arr) {
                var background = '#backgroundLabel' + id_num;
                var clickEvent = '#clickEventLabel' + id_num;
                $(background).hide();
                $(clickEvent).show();
                // $('#backgroundLabel').hide();
                // $('#clickEventLabel').show();
                $('#annoClick' + arr._leaflet_id).show();
            }

            // use ctrl + scroll to zoom in and out
            function ctrl_zoom() {
                //Use ctrl + scroll to zoom the map
                map.scrollWheelZoom.disable();

                // $("#mapid").bind('mousewheel DOMMouseScroll', function (event) {
                $(map_id).bind('mousewheel DOMMouseScroll', function (event) {
                    event.stopPropagation();
                    if (event.ctrlKey == true) {
                        event.preventDefault();
                        map.scrollWheelZoom.enable();
                        setTimeout(function () {
                            map.scrollWheelZoom.disable();
                        }, 1000);
                    } else {
                        map.scrollWheelZoom.disable();
                    }

                });
            }

            // todo: send info to manifest API if need to create one
            function pass_manifest_info() {
                // use drupal API to do it instead of finding in html
                console.log($(".field.field-name-field-obj-creator.field-type-double-field.field-label-above" +
                    " .field-items .field-item.even .container-inline .double-field-first").html());
                console.log($(".field.field-name-field-obj-creator.field-type-double-field.field-label-above" +
                    " .field-items .field-item.even .container-inline .double-field-second").html());
                var author_name = $(".field.field-name-field-obj-creator.field-type-double-field.field-label-above" +
                    " .field-items .field-item.even .container-inline .double-field-second").html();
                // remove &nbsp; in the end of author
                // reference: https://stackoverflow.com/questions/27739443/find-and-remove-words-matching-a-substring-in-a-sentence
                author_name = author_name.replace(/\S*\&nbsp\;\S*/, '');
                console.log(author_name);
            }
        });
    }
})(jQuery);