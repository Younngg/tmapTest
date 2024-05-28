import axios from 'axios';
import { useEffect } from 'react';

function App() {
  const { Tmapv2 } = window;

  function initTmap() {
    const map = new Tmapv2.Map('map_div', {
      center: new Tmapv2.LatLng(37.566481622437934, 126.98502302169841), // 지도 초기 좌표
      width: '890px',
      height: '400px',
      zoom: 15,
    });
    const resultdrawArr = [];

    // 출발지 좌표
    const marker_s = new Tmapv2.Marker({
      position: new Tmapv2.LatLng(37.564991, 126.983937),
      icon: '/upload/tmap/marker/pin_r_m_s.png',
      iconSize: new Tmapv2.Size(24, 38),
      map: map,
    });

    //도착지 좌표
    const marker_e = new Tmapv2.Marker({
      position: new Tmapv2.LatLng(37.566158, 126.98894),
      icon: '/upload/tmap/marker/pin_r_m_e.png',
      iconSize: new Tmapv2.Size(24, 38),
      map: map,
    });

    // 위험지역 좌표
    const marker_danger = new Tmapv2.Marker({
      position: new Tmapv2.LatLng(37.5662, 126.9876), //Marker의 중심좌표 설정.
      map: map, //Marker가 표시될 Map 설정.
    });

    const getRoute = async () => {
      const { data } = await axios.post(
        'https://apis.openapi.sk.com/tmap/routes/pedestrian',
        {
          startX: '126.983937',
          startY: '37.564991',
          endX: '126.988940',
          endY: '37.566158',
          reqCoordType: 'WGS84GEO',
          resCoordType: 'WGS84GEO',
          startName: '출발지',
          endName: '도착지',
        },
        {
          headers: {
            appKey: 'eJNykZi1797ndH4eZ3q6DaLfwsswVmzW5jRP2nVt',
          },
        }
      );

      const resultData = data.features;

      const drawInfoArr = [];

      // 경로 그리기
      function drawRoute(result) {
        for (var i in result) {
          //for문 [S]
          var geometry = result[i].geometry;
          var properties = result[i].properties;
          var polyline_;

          if (geometry.type === 'LineString') {
            for (var j in geometry.coordinates) {
              // 경로들의 결과값(구간)들을 포인트 객체로 변환
              var latlng = new Tmapv2.Point(
                geometry.coordinates[j][0],
                geometry.coordinates[j][1]
              );
              // 포인트객체의 정보로 좌표값 변환 객체로 저장
              var convertChange = new Tmapv2.LatLng(latlng.y, latlng.x);

              // 배열에 담기
              drawInfoArr.push(convertChange);
            }
          } else {
            var markerImg = '';
            var pType = '';
            var size;

            if (properties.pointType === 'S') {
              //출발지 마커
              markerImg = '/upload/tmap/marker/pin_r_m_s.png';
              pType = 'S';
              size = new Tmapv2.Size(24, 38);
            } else if (properties.pointType === 'E') {
              //도착지 마커
              markerImg = '/upload/tmap/marker/pin_r_m_e.png';
              pType = 'E';
              size = new Tmapv2.Size(24, 38);
            } else {
              //각 포인트 마커
              markerImg = 'http://topopen.tmap.co.kr/imgs/point.png';
              pType = 'P';
              size = new Tmapv2.Size(8, 8);
            }

            // 경로들의 결과값들을 포인트 객체로 변환
            const latlon = new Tmapv2.Point(
              geometry.coordinates[0],
              geometry.coordinates[1]
            );

            const routeInfoObj = {
              markerImage: markerImg,
              lng: latlon.x,
              lat: latlon.y,
              pointType: pType,
            };

            // Marker 추가
            const marker_p = new Tmapv2.Marker({
              position: new Tmapv2.LatLng(routeInfoObj.lat, routeInfoObj.lng),
              icon: routeInfoObj.markerImage,
              iconSize: size,
              map: map,
            });
          }
        } //for문 [E]

        drawLine(drawInfoArr);
        function drawLine(arrPoint) {
          console.log(arrPoint);
          const polyline_ = new Tmapv2.Polyline({
            path: arrPoint,
            strokeColor: '#DD0000',
            strokeWeight: 6,
            map: map,
          });
          console.log(polyline_);
          resultdrawArr.push(polyline_);
        }
      }

      // 위험지역이 경로에 포함되어있는지 여부
      const avoidPointIncluded = isPointInRoute(resultData, 126.9876, 37.5662);

      // 위험지역이 경로에 포함되어있으면 우회경로 요청
      if (avoidPointIncluded) {
        const { data } = await axios.post(
          'https://apis.openapi.sk.com/tmap/routes/pedestrian',
          {
            startX: '126.983937',
            startY: '37.564991',
            endX: '126.988940',
            endY: '37.566158',
            passList: `126.9875,37.5647`,
            reqCoordType: 'WGS84GEO',
            resCoordType: 'WGS84GEO',
            startName: '출발지',
            endName: '도착지',
          },
          {
            headers: {
              appKey: 'eJNykZi1797ndH4eZ3q6DaLfwsswVmzW5jRP2nVt',
            },
          }
        );

        drawRoute(data.features);
      }
    };

    getRoute();
  }

  // 경로 안에 위험 지역이 포함되어있는지 여부
  // threshold : 오차범위
  function isPointInRoute(route, avoidX, avoidY, threshold = 0.001) {
    for (const feature of route) {
      if (feature.geometry.type === 'Point') {
        const [x, y] = feature.geometry.coordinates;

        if (
          Math.abs(x - avoidX) < threshold &&
          Math.abs(y - avoidY) < threshold
        ) {
          return true;
        }
      }
    }
    return false;
  }

  useEffect(() => {
    // 컴포넌트가 렌더링된 후에 실행될 코드
    initTmap();
  }, []); // 빈 배열을 전달하여 컴포넌트가 처음 렌더링될 때 한 번만 실행됩니다.
  return <div id='map_div' />;
}

export default App;
