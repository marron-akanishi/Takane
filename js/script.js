const api = "07cacbf1517416f55af7198667165b95"

const search_vm = new Vue({
  el: '#search',
  data: {
    position: "現在地取得を行ってください",
    area_radius: [
      { id: 1, name: "300m"},
      { id: 2, name: "500m" },
      { id: 3, name: "1000m" },
      { id: 4, name: "2000m" },
      { id: 5, name: "3000m" },
    ],
    area_id: 2,
    latitude: null,
    longitude: null,
  },
  methods: {
    _getPos: () => {
      navigator.geolocation.getCurrentPosition(
        // 取得成功した場合
        (pos) => {
          search_vm.latitude = pos.coords.latitude;
          search_vm.longitude = pos.coords.longitude;
          search_vm.position = "緯度: " + pos.coords.latitude + ", 経度: " + pos.coords.longitude;
        },
        // 取得失敗した場合
        (error) => {
          switch (error.code) {
            case 1: //PERMISSION_DENIED
              alert("位置情報の利用が許可されていません");
              break;
            case 2: //POSITION_UNAVAILABLE
              alert("現在位置が取得できませんでした");
              break;
            case 3: //TIMEOUT
              alert("タイムアウトになりました");
              break;
            default:
              alert("その他のエラー(エラーコード:" + error.code + ")");
              break;
          }
        }
      );
    },
    _setArea: (index) => {
      search_vm.area_id = index;
    }
  }
});

const results_vm = new Vue({
  el: '#results',
  data: {
    result: null
  }
})

const getRestSearch = async (page) => {
  if(search_vm.latitude == null || search_vm.longitude == null){
    alert("最初に現在地を取得してください");
    return;
  }

  const resp = await fetch(`https://api.gnavi.co.jp/RestSearchAPI/v3/?keyid=${api}&latitude=${search_vm.latitude}&longitude=${search_vm.longitude}&range=${search_vm.area_id}`);
  results_vm.result = await resp.json();
}