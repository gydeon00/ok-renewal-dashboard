import Papa from 'papaparse'
import { supabase } from './supabaseClient'

export default function Upload() {
  function cleanNumber(value) {
    if (!value) return 0
    return Number(String(value).replace(/[$,%",]/g, '').trim()) || 0
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data
          .filter(row => row['/"'] || row['Church Name'])
          .map(row => ({
            church_name: row['/"'] || row['Church Name'] || '',
            association: row['Association'] || '',
            city: row['City'] || '',
            year: 2024,
            attendance: cleanNumber(row['2024 Attendance'] || row['Attendance']),
            baptisms: cleanNumber(row['2024 Baptisms'] || row['Baptisms']),
            total_giving: cleanNumber(row['2024 Giving'] || row['Total Giving']),
            cp_giving: cleanNumber(row['2024 CP'] || row['CP Giving']),
            attendance_trend: cleanNumber(row['Worship Growth %'] || row['Attendance Trend']),
            giving_trend: cleanNumber(row['Giving Growth %'] || row['Giving Trend']),
          }))

        const { error } = await supabase.from('church_data').insert(rows)

        if (error) {
          alert(`Upload failed: ${error.message}`)
          console.error(error)
        } else {
          alert(`Upload successful: ${rows.length} churches added`)
          window.location.reload()
        }
      }
    })
  }

  return (
    <div style={styles.uploadBox}>
      <h2>Upload ACP Data</h2>
      <p>Upload the yearly Oklahoma ACP CSV file.</p>
      <input type="file" accept=".csv" onChange={handleFile} />
    </div>
  )
}

const styles = {
  uploadBox: {
    padding: 20,
    background: '#7f1d1d',
    color: '#fff',
    fontFamily: 'Arial, sans-serif',
  },
}