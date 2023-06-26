var cron = require('node-cron');
var axios = require('axios');

cron.schedule('*/10 * * * *', () => {
  broadcastStokReport();
});

const broadcastStokReport = async () => {
	const reportResult = await axios.get(
		`https://dpcs.pupuk-indonesia.com/api/broadcast?startAt=2023-06-17&endAt=2023-06-23&secretKey=broadcastMessageStokPupukKiosPupukIndonesia`
	);

  const reportNasional = reportResult.data.filter(report => report.region === "NASIONAL")[0]

  const whatsAppMessage = `
    Selamat pagi,
    Yth. Bapak Direktur Pemasaran
    Bapk SVP PM PSO, PSO Wilayah Barat, Wilayah Timur
    Dan para VP

    Menyampaiakan hasil report stok REKAN per tanggal 19 Juni 2023 
    Rincian nasional:
    Total keseluruhan kios ${reportNasional.totalKios.toLocaleString('en-US')}
    Total kios melapor ${reportNasional.KiosLapor.toLocaleString('en-US')}
    Total kios melapor ada stok ${reportNasional.kiosStokAda.toLocaleString('en-US')}
    Total kios melapor tidak ada stok ${reportNasional.kiosStokKosong.toLocaleString('en-US')}
    Total kios tidak melapor ${reportNasional.KiosBelumLapor.toLocaleString('en-US')}
    Tautan melihat detail laporan httsp://dpcs.pupuk-Indonesia.com/nasional (DUMMY)
    
    Rincian PW 1 :
    Total keseluruhan kios 5.000 (DUMMY)
    Total kios melapor 4.500 (DUMMY)
    Total kios melapor ada stok 3.000 (DUMMY)
    Total kios melapor tidak ada stok 1.500 (DUMMY)
    Total kios tidak melapor 500 (DUMMY)
    Tautan melihat detail laporan httsp://dpcs.pupuk-Indonesia.com/pw1 (DUMMY)

    Dst. s.d PW 6

    Demikian disampaikan agar bisa ditindaklanjuti, terima kasih
  `

  await axios.post(
		`https://api.wassenger.com/v1/messages`, {
      phone: '+6282143608440',
      message: whatsAppMessage
    }, {
      headers: {
        'Token': 'f28c0f7e2079889e088e25127fc52548e22100ba5cf3726ac338d4e90a90ecf68742426266f8f38f'
      }
    }
	);
};

