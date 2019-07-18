const API = "07cacbf1517416f55af7198667165b95"
const GET_MAX = 100

// 店舗詳細
const details_vm = new Vue({
  el: "#details",
  data: {
    detail: null,
  },
  methods: {
    _returnToList: () => {
      document.querySelector("#details").style.display = "none";
      document.querySelector("#results").style.display = "";
      window.scrollTo(0, 0);
    },
    _openGnavi: () => {
      window.open(details_vm.detail.url, 'newtab');
    }
  }
})

// 検索結果一覧
const results_vm = new Vue({
  el: '#results',
  data: {
    hit_count: null,
    current_page: 1,
    page_count: 1,
    page_limit: 10,
    list_pos: 0,
    rest_list: null,
    disp_list: null,
  },
  methods: {
    // 店舗詳細を開く
    _showDetail: (data) => {
      details_vm.detail = data;
      details_vm.detail.opentime = details_vm.detail.opentime.replace(/\r?\n/g, '<br>');
      document.querySelector("#results").style.display = "none";
      document.querySelector("#details").style.display = "";
      window.scrollTo(0,0);
    }
  }
})

// 検索条件
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
    },
  }
});

// 一覧取得
const getRestSearch = async (page) => {
  // 現在地取得状態の確認
  if(search_vm.latitude == null || search_vm.longitude == null){
    alert("最初に現在地を取得してください");
    return;
  }
  // APIにアクセス
  const resp = await fetch(`
    https://api.gnavi.co.jp/RestSearchAPI/v3/?keyid=${API}&latitude=${search_vm.latitude}&longitude=${search_vm.longitude}&range=${search_vm.area_id}&hit_per_page=${GET_MAX}
  `);
  const json = await resp.json();
  console.log(json);
  results_vm.hit_count = json.total_hit_count;
  results_vm.rest_list = json.rest;
  // ページャー作成
  makePageNav(results_vm.page_limit);
  // 表示状態をリセット
  document.querySelector("#details").style.display = "none";
  document.querySelector("#results").style.display = "";
}

// ページャーの生成
const makePageNav = (limit) => {
  // 一旦削除
  document.querySelector("#pagenav").innerHTML = "";
  // ページ数計算
  if (results_vm.hit_count == 0 || results_vm.hit_count == null) return;
  results_vm.page_count = Math.floor(results_vm.hit_count / limit);
  if (results_vm.hit_count % limit != 0) results_vm.page_count++;
  if (results_vm.hit_count > GET_MAX) results_vm.page_count = GET_MAX / limit;
  // 戻るボタン
  document.querySelector("#pagenav").innerHTML += `
    <li class="page-item" id="prevpage">
      <a class="page-link" href="#" aria-label="Previous" onclick="setPage('prev')">
        <span aria-hidden="true">&laquo;</span>
      </a>
    </li>
  `
  // ページ番号
  for (let i = 1; i <= results_vm.page_count; i++) {
    document.querySelector("#pagenav").innerHTML += `<li class="page-item" id="selpage-${i}"><a class="page-link" href="#" onclick="setPage(${i})">${i}</a></li>`
  }
  // 進むボタン
  document.querySelector("#pagenav").innerHTML += `
    <li class="page-item" id="nextpage">
      <a class="page-link" href="#" aria-label="Next" onclick="setPage('next')">
        <span aria-hidden="true">&raquo;</span>
      </a>
    </li>
  `
  // 最初を選択
  document.querySelector("#prevpage").classList.add("disabled");
  document.querySelector("#selpage-1").classList.add("active");
  if (results_vm.page_count == 1) document.querySelector('#nextpage').classList.add("disabled");
  results_vm.current_page = 1;
  results_vm.list_pos = 0;
  // リストの表示範囲
  results_vm.disp_list = results_vm.rest_list.slice(results_vm.list_pos, results_vm.list_pos + results_vm.page_limit);
}

// ページネーション
const setPage = (page) => {
  switch (page) {
    case "prev":
      results_vm.current_page--;
      results_vm.list_pos -= results_vm.page_limit;
      if (results_vm.list_pos < 0) results_vm.list_pos = 0;
      break;
    case "next":
      results_vm.current_page++;
      results_vm.list_pos += results_vm.page_limit;
      break;
    default:
      results_vm.current_page = page;
      results_vm.list_pos = (page - 1) * results_vm.page_limit;
      break;
  }
  // ボタンのハイライトを変更
  document.querySelectorAll('li[id$="page"]').forEach((obj) => obj.classList.remove("disabled"));
  if (results_vm.current_page >= results_vm.page_count) document.querySelector('#nextpage').classList.add("disabled");
  if (results_vm.current_page == 1) document.querySelector('#prevpage').classList.add("disabled");
  document.querySelectorAll('li[id^="selpage-"]').forEach((obj) => obj.classList.remove("active"));
  document.querySelector(`#selpage-${results_vm.current_page}`).classList.add("active");
  // 表示範囲をずらす
  results_vm.disp_list = results_vm.rest_list.slice(results_vm.list_pos, results_vm.list_pos + results_vm.page_limit);
}