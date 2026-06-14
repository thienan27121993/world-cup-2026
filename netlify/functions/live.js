/* Netlify Function: /api/live
   環境変数 FOOTBALL_DATA_KEY に football-data.org の無料APIキーを設定するだけで動作する。
   APIキー未設定の場合は空の results を返す（アプリ側でデモ表示に切り替わる）。
*/
const JP = {
  'Mexico':'メキシコ','South Africa':'南アフリカ','Korea Republic':'韓国','Czechia':'チェコ',
  'Canada':'カナダ','Bosnia and Herzegovina':'ボスニア','United States':'アメリカ','Paraguay':'パラグアイ',
  'Qatar':'カタール','Switzerland':'スイス','Brazil':'ブラジル','Morocco':'モロッコ',
  'Haiti':'ハイチ','Scotland':'スコットランド','Germany':'ドイツ','Curaçao':'キュラソー',
  'Netherlands':'オランダ','Japan':'日本',"Côte d'Ivoire":'コートジボワール','Ecuador':'エクアドル',
  'Sweden':'スウェーデン','Tunisia':'チュニジア','Spain':'スペイン','Cape Verde':'カーボベルデ',
  'Belgium':'ベルギー','Egypt':'エジプト','Saudi Arabia':'サウジアラビア','Uruguay':'ウルグアイ',
  'Iran':'イラン','New Zealand':'ニュージーランド','France':'フランス','Senegal':'セネガル',
  'Iraq':'イラク','Norway':'ノルウェー','Argentina':'アルゼンチン','Algeria':'アルジェリア',
  'Austria':'オーストリア','Jordan':'ヨルダン','Portugal':'ポルトガル','DR Congo':'コンゴ民主',
  'England':'イングランド','Croatia':'クロアチア','Ghana':'ガーナ','Panama':'パナマ',
  'Uzbekistan':'ウズベキスタン','Colombia':'コロンビア','Australia':'オーストラリア','Turkey':'トルコ',
};

// チーム名ペア → 内部ID のルックアップテーブル
const PAIR_ID = {
  'メキシコ|南アフリカ':1,'韓国|チェコ':2,'カナダ|ボスニア':3,'アメリカ|パラグアイ':4,
  'カタール|スイス':5,'ブラジル|モロッコ':6,'ハイチ|スコットランド':7,'ドイツ|キュラソー':8,
  'オランダ|日本':9,'コートジボワール|エクアドル':10,'スウェーデン|チュニジア':11,'スペイン|カーボベルデ':12,
  'ベルギー|エジプト':13,'サウジアラビア|ウルグアイ':14,'イラン|ニュージーランド':15,'フランス|セネガル':16,
  'イラク|ノルウェー':17,'アルゼンチン|アルジェリア':18,'オーストリア|ヨルダン':19,'ポルトガル|コンゴ民主':20,
  'イングランド|クロアチア':21,'ガーナ|パナマ':22,'ウズベキスタン|コロンビア':23,'チェコ|南アフリカ':24,
  'スイス|ボスニア':25,'カナダ|カタール':26,'メキシコ|韓国':27,'アメリカ|オーストラリア':28,
  'スコットランド|モロッコ':29,'ブラジル|ハイチ':30,'トルコ|パラグアイ':31,'オランダ|スウェーデン':32,
  'ドイツ|コートジボワール':33,'エクアドル|キュラソー':34,'チュニジア|日本':35,'スペイン|サウジアラビア':36,
  'ベルギー|イラン':37,'ウルグアイ|カーボベルデ':38,'アルゼンチン|オーストリア':39,'フランス|イラク':40,
  'ノルウェー|セネガル':41,'ヨルダン|アルジェリア':42,'ポルトガル|ウズベキスタン':43,'コロンビア|コンゴ民主':44,
  '日本|スウェーデン':45,'チュニジア|オランダ':46,'ノルウェー|フランス':47,'セネガル|イラク':48,
  'カーボベルデ|サウジアラビア':49,'ウルグアイ|スペイン':50,'コロンビア|ポルトガル':51,
  'アルジェリア|オーストリア':52,'ヨルダン|アルゼンチン':53,
};

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};

exports.handler = async () => {
  const key = process.env.FOOTBALL_DATA_KEY || '';
  if (!key) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ results: {}, keyMissing: true }) };
  }

  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/2000/matches', {
      headers: { 'X-Auth-Token': key },
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();

    const results = {};
    for (const mt of (data.matches || [])) {
      const h = JP[mt.homeTeam?.name];
      const a = JP[mt.awayTeam?.name];
      if (!h || !a) continue;
      const id = PAIR_ID[`${h}|${a}`];
      if (!id) continue;
      const st = mt.status === 'FINISHED' ? 'FT'
               : (mt.status === 'IN_PLAY' || mt.status === 'PAUSED') ? 'LIVE' : 'NS';
      results[id] = {
        sh: mt.score?.fullTime?.home ?? null,
        sa: mt.score?.fullTime?.away ?? null,
        status: st,
        minute: mt.minute ?? null,
      };
    }
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ updated: new Date().toISOString(), results }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message, results: {} }) };
  }
};
