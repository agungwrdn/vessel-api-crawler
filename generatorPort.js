const axios = require("axios");
const _ = require("lodash");
const { createClient } = require("redis");
let client;

async function connectRedis() {
  if (client) return client
  client = createClient()
  client.on('error', err => console.log('Redis Client Error', err))
  await client.connect()
  return client
}
let ports = [
  {
    //dermaga petro
    position: { lat: -7.139251, lng: 112.657554 },
    length: 845,
    degree: 66,
    width: 700,
    vessels: [],
  },
  {
    //dermaga 1 pusri
    position: { lat: -2.983396, lng: 104.80172 },
    length: 140,
    degree: -14,
    width: 180,
    vessels: [],
  },
  {
    //dermaga 2 pusri
    position: { lat: -2.983249, lng: 104.800574 },
    length: 140,
    degree: 8,
    width: 120,
    vessels: [],
  },
  {
    //dermaga 3&4 pusri
    position: { lat: -2.982834, lng: 104.797965 },
    length: 285,
    degree: 8,
    width: 245,
    vessels: [],
  },
  {
    //dermaga 5 pusri
    position: { lat: -2.98257, lng: 104.796027 },
    length: 195,
    degree: 7,
    width: 180,
    vessels: [],
  },
  {
    //dermaga PKT Konstruksi atas
    position: { lat: 0.179635, lng: 117.489022 },
    length: 123,
    degree: 30,
    width: 100,
    vessels: [],
  },
  {
    //dermaga PKT Konstruksi tengah
    position: { lat: 0.178425, lng: 117.488317 },
    length: 160,
    degree: -60,
    width: 130,
    vessels: [],
  },
  {
    //dermaga PKT Konstruksi bawah
    position: { lat: 0.177728, lng: 117.489578 },
    length: 170,
    degree: -150,
    width: 130,
    vessels: [],
  },
  {
    //dermaga PKT BSL
    position: { lat: 0.180721, lng: 117.493869 },
    length: 300,
    degree: -20,
    width: 250,
    vessels: [],
  },
  {
    //dermaga PKT QAL
    position: { lat: 0.180488, lng: 117.499201 },
    length: 180,
    degree: -20,
    width: 60,
    vessels: [],
  },
  {
    //dermaga PKT TURSINA
    position: { lat: 0.173552, lng: 117.485986 },
    length: 380,
    degree: -90,
    width: 230,
    vessels: [],
  },
  {
    //dermaga PIM 1 id_jetty_9
    position: { lat: 5.239736, lng: 97.035087 },
    length: 195,
    degree: 18,
    width: 170,
    vessels: [],
  },
  {
    //dermaga PIM 2 id_jetty = 3
    position: { lat: 5.239016, lng: 97.037218 },
    length: 125,
    degree: 18,
    width: 110,
    vessels: [],
  },
  {
    //dermaga PIM 3 id_jetty = 8
    position: { lat: 5.240342, lng: 97.03321 },
    length: 195,
    degree: 18,
    width: 160,
    vessels: [],
  },
  {
    //dermaga PIM 4 id_jetty
    position: { lat: 5.2476, lng: 97.030151 },
    length: 400,
    degree: 108,
    width: 330,
    vessels: [],
  },
  {
    //dermaga PKT 6
    position: { lat: 0.180617, lng: 117.501771 },
    length: 200,
    degree: 15,
    width: 200,
    vessels: [],
  },
  {
    //dermaga PKT 7
    position: { lat: 0.173842, lng: 117.496278 },
    length: 175,
    degree: 0,
    width: 120,
    vessels: [],
  },
  {
    //dermaga PKT 8
    position: { lat: 0.173524, lng: 117.498698 },
    length: 200,
    degree: -22,
    width: 180,
    vessels: [],
  },
  {
	//dermaga 6 pusri
	nama: 'Dermaga 6 Pusri',
	position: {
		lat: -2.982382, lng: 104.806908 },
	length: 140,
	degree: -22,
	width: 120,
	vessels: [],
  }
  // Add more ports with required properties
];

async function GetPortPetroportLini2() {
  const data = await axios.get(
    "https://petroport-lini2.pupuk-indonesia.com/api/backend/get_ports?secret=59c107c49ac7ac7821af3c7eeea2a730"
  );

  return data.data.data
}

async function GetDataPKG() {
  console.log('start generate PKG')
  const apiResponse = await axios.get(
    "https://petroport.petrokimia-gresik.com/api/pi/v1/get-vessel-arrival?arrival_type=Loading&procurement=Import&from=2025-01-01&to=2030-12-31&secret_token=8AhJ17M=sWnitA9oxh7ZLy?V/cAvwIP=iCSmUCsyB2iDl=rUuIIXGlBJ1EJOEpPDpR32CP/SaxSAwCoiWFZ!4eMOutj4lucIUPW99Ym-I0vWJyk2ZQ8pyMxA8qwYZdyXPlyELdYhng?=/h/W1tP8WXFNYR=7oPCZCgwVslAvZ8fsbMIzGTjWxEAuUDob7NjHk1zh7zL2HFTHZukks!bVUl9FAT8BFSiLDETdvswYdVY?n?rRj-gi2VFz6JcVG1c7"
  );
  const data = apiResponse.data;

  data.filter(f => f.time_berthing !== null && (f.stack <= 1) && f.id_jetty_part !== null && f.id_jetty_part >= 1 && f.id_jetty_part <= 7).map((value) => {
    let position = "top";
    if (value.id_jetty_part > 4 && value.id_jetty_part <= 7) {
      position = "bottom";
    }
    let data = {
      id_jetty: value.id_jetty,
      jetty: value.jetty,
      name: value.vessel,
      description: value.arrival_type || "Antri",
      location: value.meter_start,
      asal: value.description,
      volume: 0,
      product: '',
      position: position,
      length: value.loa,
      progress: 0,
      flip: value.flip
    }
    if (data.position === 'top') {
      data.flip = !data.flip
    }

    const products = _.unionBy(value.cargo, 'name_cargo')
    value.cargo.map((values, index) => {
        data.asal = values.origin
        //data.volume += values.tonnage_total
        data.progress += values.tonnage_progress
    })

    products.map((values, index) => {
        data.product += `${values.name_cargo},`
    })
    data.volume = value.bl_tonnage
    data.progress = data.progress / data.volume * 100
    // if (!data.flip) {
    //   data.location = data.location - data.length
    // }
    ports[0].vessels.push(data)
  });


  let data1 = ports[0].vessels
  const sortedData = data1.sort((a, b) => {
      if (a.position === b.position) {
          return a.location - b.location;
      } else {
          return a.position === 'top' ? -1 : 1;
      }
  });
  // Memperbaiki location berdasarkan aturan yang diberikan
  let prevLocationTop = 0;
  let prevLengthTop = 0;
  let prevLocationBottom = 0;
  let prevLengthBottom = 0;
  sortedData.forEach(item => {
      if (item.position === 'top') {
          if (item.location < prevLocationTop) {
              item.location = prevLocationTop + prevLengthTop + 10;
          }
          prevLocationTop = item.location;
          prevLengthTop = parseFloat(item.length);
      } else {
          if (item.location <= prevLocationBottom + prevLengthBottom) {
              item.location = prevLocationBottom + prevLengthBottom + 50;
          }
          prevLocationBottom = item.location;
          prevLengthBottom = parseFloat(item.length);
      }
  });

  ports[0].vessels = sortedData
}

async function GetDataPKGDischarging() {
  console.log('start generate PKG')
  const apiResponse = await axios.get(
    "https://petroport.petrokimia-gresik.com/api/pi/v1/get-vessel-arrival?arrival_type=Discharging&procurement=Import&from=2025-01-01&to=2030-12-31&secret_token=8AhJ17M=sWnitA9oxh7ZLy?V/cAvwIP=iCSmUCsyB2iDl=rUuIIXGlBJ1EJOEpPDpR32CP/SaxSAwCoiWFZ!4eMOutj4lucIUPW99Ym-I0vWJyk2ZQ8pyMxA8qwYZdyXPlyELdYhng?=/h/W1tP8WXFNYR=7oPCZCgwVslAvZ8fsbMIzGTjWxEAuUDob7NjHk1zh7zL2HFTHZukks!bVUl9FAT8BFSiLDETdvswYdVY?n?rRj-gi2VFz6JcVG1c7"
  );
  const data = apiResponse.data;

  data.filter(f => f.time_berthing !== null && (f.stack <= 1) && f.id_jetty_part !== null && f.id_jetty_part >= 1 && f.id_jetty_part <= 7).map((value) => {
    let position = "top";
    if (value.id_jetty_part > 4 && value.id_jetty_part <= 7) {
      position = "bottom";
    }
    let data = {
      id_jetty: value.id_jetty,
      jetty: value.jetty,
      name: value.vessel,
      description: value.arrival_type || "Antri",
      location: value.meter_start,
      asal: value.description,
      volume: 0,
      product: '',
      position: position,
      length: value.loa,
      progress: 0,
      flip: value.flip
    }
    if (data.position === 'top') {
      data.flip = !data.flip
    }

    const products = _.unionBy(value.cargo, 'name_cargo')
    value.cargo.map((values, index) => {
        data.asal = values.origin
        //data.volume += values.tonnage_total
        data.progress += values.tonnage_progress
    })

    products.map((values, index) => {
        data.product += `${values.name_cargo},`
    })
    data.volume = value.bl_tonnage
    data.progress = data.progress / data.volume * 100
    // if (!data.flip) {
    //   data.location = data.location - data.length
    // }
    ports[0].vessels.push(data)
  });


  let data1 = ports[0].vessels
  const sortedData = data1.sort((a, b) => {
      if (a.position === b.position) {
          return a.location - b.location;
      } else {
          return a.position === 'top' ? -1 : 1;
      }
  });
  // Memperbaiki location berdasarkan aturan yang diberikan
  let prevLocationTop = 0;
  let prevLengthTop = 0;
  let prevLocationBottom = 0;
  let prevLengthBottom = 0;
  sortedData.forEach(item => {
      if (item.position === 'top') {
          if (item.location < prevLocationTop) {
              item.location = prevLocationTop + prevLengthTop + 10;
          }
          prevLocationTop = item.location;
          prevLengthTop = parseFloat(item.length);
      } else {
          if (item.location <= prevLocationBottom + prevLengthBottom) {
              item.location = prevLocationBottom + prevLengthBottom + 50;
          }
          prevLocationBottom = item.location;
          prevLengthBottom = parseFloat(item.length);
      }
  });

  ports[0].vessels = sortedData
}


async function GetDataPIM() {
  console.log('start generate PIM')
  const apiResponse = await axios.get(
    "https://petroport-pim.pupuk-indonesia.com/api/get/jetvis?key=2ze8suEBkbL8hU43QXK9MP3KW67K4AZ8WvsBiY19"
  );

  apiResponse.data.result.filter(f => f.time_berthing !== null && f.id_jetty_part !== null).map((value) => {
    let data = {
      name: value.kapal,
      description: value.arrival_type || "Antri",
      location: value.meter_start,
      asal: value.description,
      volume: 0,
      product: '',
      position: "top",
      length: value.loa,
      progress: 0,
      flip: !value.flip
    }
    value.progress_cargo.map((values, index) => {
        data.product += `${values.nama_cargo},`
        data.asal = values.asal
        //data.volume += values.tonnage_total
        data.progress += values.tonnage_progress
    })
    data.volume = value.bl_tonnage
    data.progress = data.progress / data.volume * 100
    // if (!data.flip) {
    //   data.location = data.location - data.length
    // }
    //ports[0].vessels.push(data)
    if (value.id_dermaga === 2) {
      ports[12].vessels.push(data);
    }
  
    if (value.id_dermaga === 1) {
      ports[11].vessels.push(data);
    }
  
    if (value.id_dermaga === 3) {
      ports[13].vessels.push(data);
    }
  
    if (value.id_dermaga === 4) {
      ports[14].vessels.push(data);
    }
  });

  

  // const data = await _.filter(apiResponse.data.result, (item) => {
  //   let position = "top";

  //   if (item.time_berthing !== null && item.time_unberthing === null) {
  //     try {
  //       const jetty = item.vessel_cargo[0].m_route.m_asset.id_jetty;
  //       const start = item.vessel_cargo[0].m_route.m_asset.meter_start;
  //       let produk = ""
  //       let volume = 0
  //       item.vessel_cargo.map(value => {
  //         produk += value.m_cargo.name
  //         volume += value.weight
  //       })
  //       const data = {
  //         name: item.m_vessel.name,
  //         asal: "",
  //         volume: Number(volume).toLocaleString(),
  //         description: item.m_arrival_type.name || "Sandar",
  //         product: produk || "-",
  //         location: item.meter_start,
  //         position: position,
  //         length: item.m_vessel.loa,
  //         progress:
  //           (item.vessel_cargo.reduce((acc, obect) => {
  //             return acc + obect.progress_muat;
  //           }, 0) /
  //             item.contract_tonnage) *
  //           100,
  //       }
  //       if (jetty === 3) {
  //         ports[12].vessels.push(data);
  //       }

  //       if (jetty === 9) {
  //         ports[11].vessels.push(data);
  //       }

  //       if (jetty === 8) {
  //         ports[13].vessels.push(data);
  //       }

  //       if (jetty === 5) {
  //         ports[14].vessels.push(data);
  //       }
  //     } catch (e) {
  //       console.log(e)
  //     }
  //     return item;
  //   }
  // });
}

async function GetDataPSP() {
  console.log('start generate PSP')
  const apiResponse = await axios.get(
    "https://gwkong.pusri.co.id/teman-pi-prod/dashboard/vessel?secret_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJBUEkgVEVNQU4gUFVTUkktRGFzaGJvYXJkIFBJIiwicm9sZV9uYW1lIjoic3VwZXIiLCJyb2xlX3VpZCI6IjYwM2YwYTg1LTBkMmEtNDY3My05MmVlLWQzNmE3MTc2MmQ0NiIsInVzZXJuYW1lIjoic3VwZXIifQ.y-Ga6QHa6TjzY1PiX6g_i_r3Sao0al2Zhsfh4nCh8ok"
  );

  const data = apiResponse.data.data;

  data.map((value) => {
    const port = value.id_port;
    let data = {
      name: value.name,
      asal: value.description,
      volume: Number(value.volume).toLocaleString(),
      description: value.type || "Sandar",
      product: value.details.map(value => {return value.product_name + ", "}) || "-",
      location: 0,
      position: "bottom",
      length: value.length,
      progress: value.progress,
    }

    if (port === "PSP_DermagaV_4") {
      

      if (data.length === 0) {
        data.length = ports[4].length/2
      }

      if (ports[4].vessels.length > 0) {
        data.location = ports[4].vessels[ports[4].vessels.length - 1].length
      }
      ports[4].vessels.push(data);
    }

    if (port === "PSP_DermagaII_2") {
      if (data.length > ports[0].length) {
        data.length = ports[2].length/3
      }
      if (data.length === 0) {
        data.length = ports[2].length/3
      }
      if (ports[2].vessels.length > 0) {
        data.location = ports[2].vessels[ports[2].vessels.length - 1].length
      }
      ports[2].vessels.push(data);
    }

    if (port === "PSP_DermagaIV_7" || port === "PSP_DermagaIII_3" || port === "PSP_DermagaIII_7" || port === "PSP_DermagaIV_3") {
      if (data.length === 0) {
        data.length = ports[3].length/4
      }
      if (ports[3].vessels.length > 0) {
        data.location = ports[3].vessels[ports[3].vessels.length - 1].length
      }
      if (port === "PSP_DermagaIII_3") {
        data.location += 20
      }
      if (port === "PSP_DermagaIV_7") {
        data.location += 120
      }
      ports[3].vessels.push(data)
    }

    if (port === "PSP_DermagaI_1") {
      data.location += 30;
      if (data.length === 0) {
        data.length = ports[1].length/2
      }
      if (ports[1].vessels.length > 0) {
        data.location = ports[1].vessels[ports[1].vessels.length - 1].length + 20
      }
      ports[1].vessels.push(data);
    }
  });
}

async function GetDataPKT() {
  console.log('start generate PKT')
  const apiResponse = await axios.get(
    "https://iportlog-api.pupukkaltim.com:3000/v2/pi-shipping-data?secret_token=!rWbIto6;oiRR}3FHHiM"
  );

  const data = apiResponse.data;

  data.filter(f => f.stack === 0 || f.vessel === 'MV JIE TAI 8').map((value) => {
    const port = value.id_jetty;
    let data = {
      name: value.vessel,
      description: value.arrival_type || "Antri",
      location: value.meter_start,
      asal: value.description,
      volume: 0,
      product: '',
      position: "top",
      length: value.loa,
      progress: 0,
      flip: value.flip
    }
    
    value.progress_cargo.map((values, index) => {
        data.product += `${values.nama_cargo}, `
        data.volume += values.tonnage_total
        data.progress += values.tonnage_progress
    })
    data.progress = data.progress / data.volume * 100
    if (!data.flip) {
      data.location = data.location - data.length
    }
    if (port === 1) {
      ports[5].vessels.push(data);
    }

    if (port === 2) {
      ports[6].vessels.push(data);
    }

    if (port === 3) {
      ports[7].vessels.push(data);
    }

    if (port === 4) {
      ports[8].vessels.push(data);
    }

    if (port === 5) {
      data.flip = true
      //data.location =  data.location - data.length
      ports[9].vessels.push(data);
    }

    if (port === 6) {
      ports[10].vessels.push(data);
    }

    if (port === 7) {
      ports[15].vessels.push(data);
    }

    if (port === 8) {
      data.position = 'bottom'
      ports[16].vessels.push(data);
    }

    if (port === 9) {
      data.position = 'bottom'
      ports[17].vessels.push(data);
    }
  });
}

async function main({ monitor, redis, sources = {} } = {}) {
  const phase = (name, callback, details) => monitor && monitor.phase
    ? monitor.phase(name, callback, details)
    : callback()
  const redisClient = await phase('redis-connect', async () => redis || connectRedis())
  try {
    await phase('redis-clear', () => redisClient.DEL("port_vessel_v2"))
  } catch (error) {
    console.log(error)
  }
  try {
    await phase('fetch-port-pim', sources.PIM || GetDataPIM)
  } catch (error) {
    
  }

  try {
    await phase('fetch-port-pkg-loading', sources.PKG || GetDataPKG)
  } catch (error) {
    console.log(error)
  }

  try {
    await phase('fetch-port-pkg-discharging', sources.PKGDischarging || GetDataPKGDischarging)
  } catch (error) {
    console.log(error)
  }

  try {
    await phase('fetch-port-pkt', sources.PKT || GetDataPKT)
  } catch (error) {
    
  }

  try {
    await phase('fetch-port-psp', sources.PSP || GetDataPSP)
  } catch (error) {
    
  }

  await phase('redis-write', () => redisClient.set('port_vessel_v2', JSON.stringify(ports)));
  ports = [
    {
      //dermaga petro
      position: { lat: -7.139251, lng: 112.657554 },
      length: 845,
      degree: 66,
      width: 700,
      vessels: [],
    },
    {
      //dermaga 1 pusri
      position: { lat: -2.983396, lng: 104.80172 },
      length: 140,
      degree: -14,
      width: 180,
      vessels: [],
    },
    {
      //dermaga 2 pusri
      position: { lat: -2.983249, lng: 104.800574 },
      length: 140,
      degree: 8,
      width: 120,
      vessels: [],
    },
    {
      //dermaga 3&4 pusri
      position: { lat: -2.982834, lng: 104.797965 },
      length: 285,
      degree: 8,
      width: 245,
      vessels: [],
    },
    {
      //dermaga 5 pusri
      position: { lat: -2.98257, lng: 104.796027 },
      length: 195,
      degree: 7,
      width: 180,
      vessels: [],
    },
    {
      //dermaga PKT Konstruksi atas
      position: { lat: 0.179635, lng: 117.489022 },
      length: 123,
      degree: 30,
      width: 100,
      vessels: [],
    },
    {
      //dermaga PKT Konstruksi tengah
      position: { lat: 0.178425, lng: 117.488317 },
      length: 160,
      degree: -60,
      width: 130,
      vessels: [],
    },
    {
      //dermaga PKT Konstruksi bawah
      position: { lat: 0.177728, lng: 117.489578 },
      length: 170,
      degree: -150,
      width: 130,
      vessels: [],
    },
    {
      //dermaga PKT BSL
      position: { lat: 0.180721, lng: 117.493869 },
      length: 300,
      degree: -20,
      width: 300,
      vessels: [],
    },
    {
      //dermaga PKT QAL
      position: { lat: 0.180488, lng: 117.499201 },
      length: 180,
      degree: -20,
      width: 60,
      vessels: [],
    },
    {
      //dermaga PKT TURSINA
      position: { lat: 0.173552, lng: 117.485986 },
      length: 380,
      degree: -90,
      width: 230,
      vessels: [],
    },
    {
      //dermaga PIM 1 id_jetty_9
      position: { lat: 5.239736, lng: 97.035087 },
      length: 195,
      degree: 18,
      width: 170,
      vessels: [],
    },
    {
      //dermaga PIM 2 id_jetty = 3
      position: { lat: 5.239016, lng: 97.037218 },
      length: 125,
      degree: 18,
      width: 110,
      vessels: [],
    },
    {
      //dermaga PIM 3 id_jetty = 8
      position: { lat: 5.240342, lng: 97.03321 },
      length: 195,
      degree: 18,
      width: 160,
      vessels: [],
    },
    {
      //dermaga PIM 4 id_jetty
      position: { lat: 5.2476, lng: 97.030151 },
      length: 400,
      degree: 108,
      width: 330,
      vessels: [],
    },
    {
      //dermaga PKT 6
      position: { lat: 0.180617, lng: 117.501771 },
      length: 175,
      degree: 15,
      width: 170,
      vessels: [],
    },
    {
      //dermaga PKT 7
      position: { lat: 0.173842, lng: 117.496278 },
      length: 175,
      degree: 0,
      width: 120,
      vessels: [],
    },
    {
      //dermaga PKT 8
      position: { lat: 0.173524, lng: 117.498698 },
      length: 200,
      degree: -22,
      width: 180,
      vessels: [],
    },
	{
		//dermaga 6 pusri
		nama: 'Dermaga 6 Pusri',
		position: {
			lat: -2.982382, lng: 104.806908 },
		length: 140,
		degree: -22,
		width: 120,
		vessels: [],
	  }
    // Add more ports with required properties
  ];
  console.log("DONE")
}

function start(intervalMs = 1 * 60 * 60 * 1000, { monitor } = {}) {
  const execute = () => monitor ? monitor.run((context) => main({ monitor: context })) : main()
  execute()
  return setInterval(function () {
    console.log('Generating port data...')
    execute()
  }, intervalMs)
}

if (require.main === module) {
  start()
}

module.exports = { main, start }
