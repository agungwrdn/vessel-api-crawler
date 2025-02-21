const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const axios = require('axios')
const moment = require('moment')

const config = {
    headers: {
      'Authorization': `Bearer ySlQH1xvflKM`
    }
  };
function main() {
    axios.get('https://vms.dtp.net.id/api/tracking', config)
    .then(async response => {
      const data = response.data
      listRowData = []
      await Object.keys(data).forEach(value => {
          try {
              if (!isNaN(parseInt(value))) {
                  listRowData.push(value)
              }
  
          } catch (error) {
              console.log(error)
          }
      })
  
      for (let index = 0; index <= listRowData.length; index++) {
          const item = data[`${index}`]
          if (item !== undefined) {
            console.log(item)
              var mssi = item.mmsi.toString()
              const timeGPS = moment(item.lastvalidgps, "YYYY-MM-DD hh:mm:ss A").toISOString()
              await prisma.device_gps.upsert({
                  where: {
                      id: mssi
                  },
                  update: {
                      keterangan: item.name,
                      nama_kapal: item.name
                  },
                  create: {
                      id: mssi,
                      keterangan: item.name,
                      nama_kapal: item.name
                  }
              }).catch(error => {
                  console.log(error)
              })
      
              await prisma.device_gpsHits.create({
                  data: {
                      ObjectID: mssi,
                      Lat: item.latitude,
                      Lon: item.longitude,
                      Speed: item.speed,
                      GPSTime: timeGPS,
                      LastDataTime: timeGPS
                  }
              }).catch(error => {
                  console.log("MBUH OK", error)
              })
          }
      }
  
      //console.log('Response:', response.data);
    })
    .catch(error => {
      console.error('Error:', error.message);
    });
  
}
main()

setInterval(function () {
    console.log('INI GPS BARU');
    main()
}, 1 * 60 * 60 * 1000); 