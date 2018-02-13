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
    var d3 = window['d3'];

    "use strict";
    export class Visual implements IVisual {
        private dataView: DataView;
        private map: L.Map;
        private basemap: L.TileLayer;
        private markerLayer: L.LayerGroup<L.CircleMarker>;


        constructor(options: VisualConstructorOptions) {
            let mapDiv = document.createElement('div');
            mapDiv.setAttribute('id', 'map');
            mapDiv.style.height = '720px';

            options.element.appendChild(mapDiv);

            var attribution ='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
            this.basemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: attribution});

            this.map = L.map('map', {
                center: new L.LatLng(25, 0),
                zoom: 2
            });

            this.map.addLayer(this.basemap);
        }

        public static converter(dataView: DataView) {
            console.log(dataView);
            const {columns, rows} = dataView.table;
            console.log(d3);
            const c10 = d3.scaleOrdinal(['green', 'red', 'yellow']);

            const datas = rows.map(function (row, idx) {
                let data = row.reduce(function (d, v, i) {
                    const role = Object.keys(columns[i].roles)[0];

                    if (role == 'tooltip') {
                        if(!d[role]) {
                            d[role] = [v];
                        }
                        else {
                            d[role] = [...d[role], v];
                        }
                    }
                    else {
                        d[role] = v;
                    }

                    return d;
                }, {});
                
                data['color'] = c10(data['category']);

                return data;
            });

            return datas;
        }

        public static popupStyle(arr: [any], thumbnail: string) {
            const div = document.createElement("div");
            const img = document.createElement("img");
            img.setAttribute("data-src", thumbnail);
            img.setAttribute("style", "height:60px;");
            img.setAttribute("class", "lazy");
            div.appendChild(img);
            for (const v of arr) {
                const p = document.createElement("p");
                p.textContent = v;
                div.appendChild(p);
            }

            return div;
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