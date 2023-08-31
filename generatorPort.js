const axios = require("axios");
const _ = require("lodash");
const { createClient } = require("redis");
const client = createClient();
client.on('error', err => console.log('Redis Client Error', err));

client.connect();

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
    length: 68,
    degree: -20,
    width: 60,
    vessels: [],
  },
  {
    //dermaga PKT TURSINA
    position: { lat: 0.173552, lng: 117.485986 },
    length: 270,
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
    length: 386,
    degree: 108,
    width: 330,
    vessels: [],
  },
  {
    //dermaga PKT 6
    position: { lat: 0.180617, lng: 117.501771 },
    length: 105,
    degree: 15,
    width: 170,
    vessels: [],
  },
  {
    //dermaga PKT 7
    position: { lat: 0.173842, lng: 117.496278 },
    length: 105,
    degree: 0,
    width: 120,
    vessels: [],
  },
  {
    //dermaga PKT 8
    position: { lat: 0.173524, lng: 117.498698 },
    length: 176,
    degree: -22,
    width: 180,
    vessels: [],
  },
  // Add more ports with required properties
];

async function GetDataPKG() {
  const apiResponse = await axios.get(
    "https://petroport.petrokimia-gresik.com/api/get/arrival/loading"
  );
  const data = await _.filter(apiResponse.data.result, (item) => {
    let position = "top";
    if (item.id_jetty_part > 4) {
      position = "bottom";
    }
    if (item.time_berthing !== null && item.time_unberthing === null) {
      ports[0].vessels.push({
        name: item.m_vessel.name,
        description: item.m_arrival_type.name || "Sandar",
        location: item.meter_start,
        position: position,
        length: item.m_vessel.loa,
        progress:
          (item.vessel_cargo.reduce((acc, obect) => {
            return acc + obect.progress_muat;
          }, 0) /
            item.contract_tonnage) *
          100,
      });
      return item;
    }
  });
}

async function GetDataPIM() {
  const apiResponse = await axios.get(
    "https://petroport-pim.pupuk-indonesia.com/api/get/arrival/loading"
  );

  const data = await _.filter(apiResponse.data.result, (item) => {
    let position = "top";

    if (item.time_berthing !== null && item.time_unberthing === null) {
      try {
        const jetty = item.vessel_cargo[0].m_route.m_asset.id_jetty;
        const start = item.vessel_cargo[0].m_route.m_asset.meter_start;
        if (jetty === 3) {
          ports[12].vessels.push({
            name: item.m_vessel.name,
            description: item.m_arrival_type.name || "Sandar",
            location: start,
            position: position,
            length: item.m_vessel.loa,
            progress:
              (item.vessel_cargo.reduce((acc, obect) => {
                return acc + obect.progress_muat;
              }, 0) /
                item.contract_tonnage) *
              100,
          });
        }

        if (jetty === 9) {
          ports[11].vessels.push({
            name: item.m_vessel.name,
            description: item.m_arrival_type.name || "Sandar",
            location: start,
            position: position,
            length: item.m_vessel.loa,
            progress:
              (item.vessel_cargo.reduce((acc, obect) => {
                return acc + obect.progress_muat;
              }, 0) /
                item.contract_tonnage) *
              100,
          });

          if (jetty === 8) {
            ports[13].vessels.push({
              name: item.m_vessel.name,
              description: item.m_arrival_type.name || "Sandar",
              location: start,
              position: position,
              length: item.m_vessel.loa,
              progress:
                (item.vessel_cargo.reduce((acc, obect) => {
                  return acc + obect.progress_muat;
                }, 0) /
                  item.contract_tonnage) *
                100,
            });
          }

          if (jetty === 5) {
            ports[14].vessels.push({
              name: item.m_vessel.name,
              description: item.m_arrival_type.name || "Sandar",
              location: start,
              position: position,
              length: item.m_vessel.loa,
              progress:
                (item.vessel_cargo.reduce((acc, obect) => {
                  return acc + obect.progress_muat;
                }, 0) /
                  item.contract_tonnage) *
                100,
            });
          }
        }
      } catch (e) {}
      return item;
    }
  });
}

async function GetDataPSP() {
  const apiResponse = await axios.get(
    "https://gwkong.pusri.co.id/teman-pi-prod/dashboard/vessel?secret_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJBUEkgVEVNQU4gUFVTUkktRGFzaGJvYXJkIFBJIiwicm9sZV9uYW1lIjoic3VwZXIiLCJyb2xlX3VpZCI6IjYwM2YwYTg1LTBkMmEtNDY3My05MmVlLWQzNmE3MTc2MmQ0NiIsInVzZXJuYW1lIjoic3VwZXIifQ.y-Ga6QHa6TjzY1PiX6g_i_r3Sao0al2Zhsfh4nCh8ok"
  );

  const data = apiResponse.data.data;

  data.map((value) => {
    const port = value.id_port;
    if (port === "PSP_DermagaV_4") {
      ports[3].vessels.push({
        name: value.name,
        description: value.type || "Sandar",
        location: 0,
        position: "top",
        length: value.length,
        progress: value.progress,
      });
    }

    if (port === "PSP_DermagaII_2") {
      ports[2].vessels.push({
        name: value.name,
        description: value.type || "Sandar",
        location: 0,
        position: "top",
        length: value.length,
        progress: value.progress,
      });
    }
  });
}

async function GetDataPKT() {
  const apiResponse = await axios.get(
    "https://iportlog-api.pupukkaltim.com:3000/pi-shipping-data?secret_token=!rWbIto6;oiRR}3FHHiM"
  );

  const data = apiResponse.data;

  data.map((value) => {
    const port = value.id_port;
    if (port === "PKT_1Utara") {

      ports[5].vessels.push({
        name: value.name,
        description: value.type || "Sandar",
        location: 0,
        position: "top",
        length: value.length,
        progress: value.progress,
      });
    }

    if (port === "PKT_1Barat") {
      ports[6].vessels.push({
        name: value.name,
        description: value.type || "Sandar",
        location: 0,
        position: "top",
        length: value.length,
        progress: value.progress,
      });
    }

    if (port === "PKT_1Selatan") {
      ports[7].vessels.push({
        name: value.name,
        description: value.type || "Sandar",
        location: 0,
        position: "top",
        length: value.length,
        progress: value.progress,
      });
    }

    if (port === "PKT_2") {
      ports[8].vessels.push({
        name: value.name,
        description: value.type || "Sandar",
        location: 0,
        position: "top",
        length: value.length,
        progress: value.progress,
      });
    }

    if (port === "PKT_3") {
      ports[9].vessels.push({
        name: value.name,
        description: value.type || "Sandar",
        location: 0,
        position: "top",
        length: value.length,
        progress: value.progress,
      });
    }

    if (port === "PKT_4") {
      ports[10].vessels.push({
        name: value.name,
        description: value.type || "Sandar",
        location: 0,
        position: "top",
        length: value.length,
        progress: value.progress,
      });
    }

    if (port === "PKT_6") {
      ports[15].vessels.push({
        name: value.name,
        description: value.type || "Sandar",
        location: 0,
        position: "top",
        length: value.length,
        progress: value.progress,
      });
    }

    if (port === "PKT_7") {
      ports[16].vessels.push({
        name: value.name,
        description: value.type || "Sandar",
        location: 0,
        position: "bottom",
        length: value.length,
        progress: value.progress,
      });
    }

    if (port === "PKT_8") {
      ports[17].vessels.push({
        name: value.name,
        description: value.type || "Sandar",
        location: 0,
        position: "bottom",
        length: value.length,
        progress: value.progress,
      });
    }
  });
}

async function main() {
  try {
    await client.del('port_vessel');
  } catch (error) {
    
  }
  try {
    await GetDataPIM();
    await GetDataPKG();
    await GetDataPSP();
    await GetDataPKT();
  } catch (error) {

  } finally {
    await client.set('port_vessel', JSON.stringify(ports));
  }
  const result = await client.get('port_vessel')
  console.log(JSON.parse(result))
}

main()

setInterval(function () {
  console.log('The answer to life, the universe, and everything!');
  main()
}, 1 * 60 * 60 * 1000); 