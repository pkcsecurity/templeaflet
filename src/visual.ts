/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {

    var L = window['L'];

    "use strict";
    export class Visual implements IVisual {
        private dataView: DataView;
        private map: L.Map;
        private markerLayer: L.LayerGroup<L.CircleMarker>;

        constructor(options: VisualConstructorOptions) {
            let mapDiv = document.createElement('div');
            mapDiv.setAttribute('id', 'map');
            mapDiv.style.height = '720px';

            options.element.appendChild(mapDiv);

            // OSM Version
            //var attribution ='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
            //var streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: attribution});

            // Mapbox Version
            /*var attribution = '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>';

            var streets = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.{format}?access_token={accessToken}', {
                id: 'mapbox.run-bike-hike',
                format: 'png',
                attribution: attribution,
                accessToken: 'TOKEN_GOES_HERE'
            });*/

            // ESRI Version
            var streets =L.esri.basemapLayer('Streets');

            this.map = L.map('map', {
                center: new L.LatLng(25, 0),
                zoom: 2,
                layers: [streets],
            });
        }

        private static colorSPI(category: any) {
            if (category > 1) {
                return '#5b8943';
            }
            else if (category < 1) {
                return '#951a21';
            }
            else {
                return '#de913b';
            }

        }

        public static converter(dataView: DataView) {
            console.log(dataView);
            const {columns, rows} = dataView.table;

            const datas = rows.map(function (row, idx) {
                let data = row.reduce(function (d, v, i) {
                    const role = Object.keys(columns[i].roles)[0];
                    const displayName = columns[i].displayName;

                    if (role == 'tooltip') {
                        if(!d[role]) {
                            d[role] = [displayName + ": " + v];
                        }
                        else {
                            d[role] = [...d[role], displayName + ": " + v];
                        }
                    }
                    else {
                        d[role] = v;
                    }

                    return d;
                }, {});
                
                data['color'] = Visual.colorSPI(data['category']);

                return data;
            });

            return datas;
        }

        public static popupStyle(arr: [any], thumbnail: string) {
            const root = document.createElement("div");
            const image = document.createElement("div");
            const desc = document.createElement("div");
            root.setAttribute("class", "popup-container");
            image.setAttribute("class", "popup-container__image");
            desc.setAttribute("class", "popup-container__desc");

            root.appendChild(image);
            root.appendChild(desc);

            const img = document.createElement("img");
            img.setAttribute("class", "thumbnail lazy");
            img.setAttribute("data-src", thumbnail);
            image.appendChild(img);
            for (const v of arr) {
                const p = document.createElement("p");
                p.textContent = v;
                desc.appendChild(p);
            }

            return root;
        }

        public update(options: VisualUpdateOptions) {
            let mapEl = document.getElementById('map');
            const height = options.viewport.height + 'px';
            const width = options.viewport.width + 'px';
            mapEl.style.height = height;
            mapEl.style.width = width;

            this.map.invalidateSize(true);

            console.log(options.dataViews);

            if (!options.dataViews && !options.dataViews[0]) return;
        
            if (this.markerLayer) this.map.removeLayer(this.markerLayer);

            this.dataView = options.dataViews[0];
            console.log("dv length:", this.dataView.table.rows.length);
            const data = Visual.converter(this.dataView);
            console.log("length:", data.length);

            console.log(data[0]);

            const markers = data.map(function (d) {
                const latlng = L.latLng([d['latitude'], d['longitude']]);
                const marker = L.circleMarker(latlng, {color: d['color'], fillOpacity: 1});
                marker.setRadius(1);

                const category = d['category'] ? d['category'] : 'NA';
                marker.bindPopup(Visual.popupStyle(d['tooltip'], d['thumbnail']));
                marker.on('popupopen', (x) => {
                        const popupEl = x.popup.getContent();
                        const imgEl = popupEl.querySelector("img");
                        imgEl.src = imgEl.getAttribute("data-src");
                });

                return marker;
            });

            this.markerLayer = L.layerGroup(markers);
            this.map.addLayer(this.markerLayer);
        }

        public destroy() {
            console.log('destroy called');
            this.map.remove();
        }
    }
}