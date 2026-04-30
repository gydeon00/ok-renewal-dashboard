import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import { styles } from './DashboardStyles'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { Pie, Bar, Line } from 'react-chartjs-2'

ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
)

export default function Dashboard() {
  const [data, setData] = useState([])
  const [association, setAssociation] = useState('All')
  const [selectedChurch, setSelectedChurch] = useState('All')
  const [churchSearch, setChurchSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState('Latest')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)

    let allRows = []
    let from = 0
    let to = 999
    let keepGoing = true

    while (keepGoing) {
      const { data, error } = await supabase
        .from('church_data')
        .select('*')
        .order('church_name', { ascending: true })
        .range(from, to)

      if (error) {
        console.error(error)
        alert('Could not load church data')
        setLoading(false)
        return
      }

      allRows = [...allRows, ...(data || [])]

      if (!data || data.length < 1000) {
        keepGoing = false
      } else {
        from += 1000
        to += 1000
      }
    }

    setData(allRows)
    setLoading(false)
  }

  function num(value) {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }

  function money(value) {
    return num(value).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    })
  }

  function pct(value) {
    return `${num(value).toFixed(2).replace('.00', '')}%`
  }

  function classifyChurch(church) {
    const trend = Number(church.attendance_trend)
    if (!Number.isFinite(trend)) return 'Insufficient Data'
    if (trend > 5) return 'Growing'
    if (trend >= -5 && trend <= 5) return 'Plateaued'
    return 'Declining'
  }

  function renewalWindow(church) {
    const attendance = num(church.attendance)
    const trend = num(church.attendance_trend)
    const baptisms = num(church.baptisms)

    if (attendance < 50 && trend < -10) return 'Replant Window'
    if (attendance < 75 && trend < -5 && baptisms === 0) return 'Replant Window'
    if (trend < -5) return 'Window 2 – Persistent Decline'
    if (trend >= -5 && trend <= 5) return 'Window 1 – Plateau / Early Decline'
    if (trend > 5) return 'Healthy / Growing'

    return 'Needs Review'
  }

  function actionGroup(church) {
    const attendance = num(church.attendance)
    const trend = Number(church.attendance_trend)
    const baptisms = num(church.baptisms)
    const cpGiving = num(church.cp_giving)

    if (!Number.isFinite(trend)) return 'Group D – Data Gap / Clarification Needed'
    if (attendance < 50 && trend < -10) return 'Group C – Critical / Replant Candidate'
    if (attendance < 75 && trend < -5 && baptisms === 0) return 'Group C – Critical / Replant Candidate'
    if (trend < -5 && (attendance >= 75 || cpGiving > 0 || baptisms > 0)) return 'Group B – Strategic Decliner'
    if (trend >= -5) return 'Group A – Receptive Renewal Candidate'

    return 'Group D – Data Gap / Clarification Needed'
  }

  function pathway(church) {
    const window = renewalWindow(church)

    if (window === 'Healthy / Growing') return 'Encourage, learn from, and consider as a partner church'
    if (window.includes('Window 1')) return 'Revitalization / Assisted Revitalization'
    if (window.includes('Window 2')) return 'Assisted Revitalization, Church Fostering, or Covenant Renewal'
    if (window.includes('Replant')) return 'Replant, Merger, Adoption, Legacy Agreement, or Closure Discernment'

    return 'Further Development Required'
  }

  function nextStep(church) {
    const group = actionGroup(church)

    if (group.includes('Group A')) return 'Begin with a 30-day assessment and leadership alignment conversation.'
    if (group.includes('Group B')) return 'Engage quickly with a focused intervention conversation and trendline review.'
    if (group.includes('Group C')) return 'Do not treat as normal revitalization. Begin replant, merger, adoption, or legacy discussion.'

    return 'Clarify missing data before making a recommendation.'
  }

  function annualProjection(current, trend, years) {
    const rate = num(trend) / 100
    return Math.max(0, Math.round(num(current) * Math.pow(1 + rate, years)))
  }

  function viabilityEstimate(church) {
    const attendance = num(church.attendance)
    const trend = num(church.attendance_trend)

    if (trend >= 0) return 'No projected attendance viability cliff based on current trend.'
    if (attendance <= 0) return 'No current attendance reported.'

    const yearlyLoss = Math.abs(attendance * (trend / 100))
    if (yearlyLoss <= 0) return 'Needs more data.'

    const yearsTo50 = Math.ceil((attendance - 50) / yearlyLoss)

    if (attendance < 50) return 'Already below common critical-mass threshold.'
    if (yearsTo50 <= 0) return 'Already near critical threshold.'

    return `Approx. ${yearsTo50} years to fall below 50 attendance if trend continues.`
  }

  const years = useMemo(() => {
    return [...new Set(data.map(d => Number(d.year)).filter(Boolean))]
      .sort((a, b) => b - a)
  }, [data])

  const latestYear = years[0] || null

  const associations = useMemo(() => {
    return [...new Set(data.map(d => d.association).filter(Boolean))].sort()
  }, [data])

  const churchOptions = useMemo(() => {
    const yearToUse = selectedYear === 'Latest' ? latestYear : Number(selectedYear)

    return data
      .filter(church => !yearToUse || Number(church.year) === Number(yearToUse))
      .filter(church => association === 'All' || church.association === association)
      .map(church => church.church_name)
      .filter(Boolean)
      .sort()
  }, [data, association, selectedYear, latestYear])

  const filtered = useMemo(() => {
    const yearToUse = selectedYear === 'Latest' ? latestYear : Number(selectedYear)

    return data.filter(church => {
      const matchesYear = !yearToUse || Number(church.year) === Number(yearToUse)
      const matchesAssociation = association === 'All' || church.association === association
      const matchesChurch = selectedChurch === 'All' || church.church_name === selectedChurch
      const matchesSearch =
        churchSearch.trim() === '' ||
        church.church_name?.toLowerCase().includes(churchSearch.toLowerCase())

      return matchesYear && matchesAssociation && matchesChurch && matchesSearch
    })
  }, [data, selectedYear, latestYear, association, selectedChurch, churchSearch])

  const summary = useMemo(() => {
    return {
      totalAttendance: filtered.reduce((sum, c) => sum + num(c.attendance), 0),
      totalBaptisms: filtered.reduce((sum, c) => sum + num(c.baptisms), 0),
      totalGiving: filtered.reduce((sum, c) => sum + num(c.total_giving), 0),
      totalCp: filtered.reduce((sum, c) => sum + num(c.cp_giving), 0),
      growing: filtered.filter(c => classifyChurch(c) === 'Growing').length,
      plateaued: filtered.filter(c => classifyChurch(c) === 'Plateaued').length,
      declining: filtered.filter(c => classifyChurch(c) === 'Declining').length,
      insufficient: filtered.filter(c => classifyChurch(c) === 'Insufficient Data').length,
      groupA: filtered.filter(c => actionGroup(c).includes('Group A')).length,
      groupB: filtered.filter(c => actionGroup(c).includes('Group B')).length,
      groupC: filtered.filter(c => actionGroup(c).includes('Group C')).length,
      groupD: filtered.filter(c => actionGroup(c).includes('Group D')).length,
    }
  }, [filtered])

  const topTen = useMemo(() => {
    return [...filtered]
      .map(church => {
        let score = 0
        const group = actionGroup(church)
        const attendance = num(church.attendance)
        const baptisms = num(church.baptisms)
        const cp = num(church.cp_giving)
        const trend = num(church.attendance_trend)

        if (group.includes('Group B')) score += 50
        if (group.includes('Group A')) score += 35
        if (group.includes('Group C')) score += 15

        score += Math.min(attendance / 10, 30)
        score += Math.min(baptisms * 3, 20)
        score += Math.min(cp / 1000, 20)

        if (trend < -5) score += 10
        if (trend < -15) score += 10

        return { ...church, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  }, [filtered])

  const selectedChurchRecord = useMemo(() => {
    if (selectedChurch === 'All') return null
    const yearToUse = selectedYear === 'Latest' ? latestYear : Number(selectedYear)

    return data.find(c =>
      c.church_name === selectedChurch &&
      (!yearToUse || Number(c.year) === Number(yearToUse))
    )
  }, [selectedChurch, selectedYear, latestYear, data])

  const selectedChurchHistory = useMemo(() => {
    if (selectedChurch === 'All') return []

    return data
      .filter(c => c.church_name === selectedChurch)
      .sort((a, b) => Number(a.year) - Number(b.year))
  }, [selectedChurch, data])

  const healthChartData = {
    labels: ['Growing', 'Plateaued', 'Declining', 'Insufficient Data'],
    datasets: [
      {
        data: [summary.growing, summary.plateaued, summary.declining, summary.insufficient],
        backgroundColor: ['#15803d', '#ca8a04', '#b91c1c', '#6b7280'],
      },
    ],
  }

  const groupChartData = {
    labels: ['Group A Renewal', 'Group B Strategic', 'Group C Critical', 'Group D Data Gap'],
    datasets: [
      {
        label: 'Churches',
        data: [summary.groupA, summary.groupB, summary.groupC, summary.groupD],
        backgroundColor: ['#2563eb', '#f97316', '#991b1b', '#6b7280'],
      },
    ],
  }

  const churchTrendChartData = {
    labels: selectedChurchHistory.map(c => c.year),
    datasets: [
      {
        label: 'Attendance',
        data: selectedChurchHistory.map(c => num(c.attendance)),
        borderColor: '#2563eb',
        backgroundColor: '#2563eb',
        tension: 0.3,
      },
      {
        label: 'Baptisms',
        data: selectedChurchHistory.map(c => num(c.baptisms)),
        borderColor: '#15803d',
        backgroundColor: '#15803d',
        tension: 0.3,
      },
    ],
  }

  const churchGivingChartData = {
    labels: selectedChurchHistory.map(c => c.year),
    datasets: [
      {
        label: 'Total Giving',
        data: selectedChurchHistory.map(c => num(c.total_giving)),
        borderColor: '#7f1d1d',
        backgroundColor: '#7f1d1d',
        tension: 0.3,
      },
      {
        label: 'CP Giving',
        data: selectedChurchHistory.map(c => num(c.cp_giving)),
        borderColor: '#9333ea',
        backgroundColor: '#9333ea',
        tension: 0.3,
      },
    ],
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  }

  function csvEscape(value) {
    if (value === null || value === undefined) return ''
    return `"${String(value).replace(/"/g, '""')}"`
  }

  function downloadCsv(filename, rows) {
    if (!rows.length) {
      alert('No data to export.')
      return
    }

    const headers = Object.keys(rows[0])
    const csv = [
      headers.map(csvEscape).join(','),
      ...rows.map(row => headers.map(header => csvEscape(row[header])).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = filename
    link.click()

    URL.revokeObjectURL(url)
  }

  function exportFilteredChurches() {
    const rows = filtered.map(church => ({
      Church: church.church_name,
      Association: church.association,
      Year: church.year,
      Attendance: num(church.attendance),
      Baptisms: num(church.baptisms),
      TotalGiving: num(church.total_giving),
      CPGiving: num(church.cp_giving),
      AttendanceTrend: pct(church.attendance_trend),
      GivingTrend: pct(church.giving_trend),
      Status: classifyChurch(church),
      RenewalWindow: renewalWindow(church),
      ActionGroup: actionGroup(church),
      Pathway: pathway(church),
      NextStep: nextStep(church),
    }))

    downloadCsv('church-renewal-filtered-list.csv', rows)
  }

  function exportTopTen() {
    const rows = topTen.map((church, index) => ({
      Rank: index + 1,
      Church: church.church_name,
      Association: church.association,
      Year: church.year,
      Attendance: num(church.attendance),
      Baptisms: num(church.baptisms),
      CPGiving: num(church.cp_giving),
      AttendanceTrend: pct(church.attendance_trend),
      ActionGroup: actionGroup(church),
      Pathway: pathway(church),
      NextStep: nextStep(church),
    }))

    downloadCsv('top-10-churches-to-engage.csv', rows)
  }

  function exportSelectedChurch() {
    if (!selectedChurchRecord) {
      alert('Select a church first.')
      return
    }

    const rows = selectedChurchHistory.map(church => ({
      Church: church.church_name,
      Association: church.association,
      Year: church.year,
      Attendance: num(church.attendance),
      Baptisms: num(church.baptisms),
      TotalGiving: num(church.total_giving),
      CPGiving: num(church.cp_giving),
      AttendanceTrend: pct(church.attendance_trend),
      GivingTrend: pct(church.giving_trend),
      Status: classifyChurch(church),
      RenewalWindow: renewalWindow(church),
      ActionGroup: actionGroup(church),
      Pathway: pathway(church),
      NextStep: nextStep(church),
    }))

    downloadCsv(`${selectedChurchRecord.church_name}-church-report.csv`, rows)
  }

  function resetFilters() {
    setAssociation('All')
    setSelectedChurch('All')
    setChurchSearch('')
    setSelectedYear('Latest')
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Oklahoma Church Renewal Dashboard</h1>
          <p style={styles.subtitle}>
            Live ACP-based renewal, revitalization, and replant strategy tool.
            {latestYear && ` Viewing ${selectedYear === 'Latest' ? latestYear : selectedYear} data.`}
          </p>
        </div>

        <button onClick={() => window.print()} style={styles.primaryButton}>
          Print / Save PDF
        </button>
      </div>

      <div style={styles.filters}>
        <div style={styles.field}>
          <label style={styles.label}>Year</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={styles.input}>
            <option value="Latest">Latest Year</option>
            {years.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Association</label>
          <select
            value={association}
            onChange={(e) => {
              setAssociation(e.target.value)
              setSelectedChurch('All')
            }}
            style={styles.input}
          >
            <option value="All">All Associations</option>
            {associations.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div style={styles.fieldWide}>
          <label style={styles.label}>Church</label>
          <select value={selectedChurch} onChange={(e) => setSelectedChurch(e.target.value)} style={styles.input}>
            <option value="All">All Churches</option>
            {churchOptions.map(church => <option key={church} value={church}>{church}</option>)}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Search</label>
          <input
            value={churchSearch}
            onChange={(e) => setChurchSearch(e.target.value)}
            placeholder="Search church name..."
            style={styles.input}
          />
        </div>

        <button onClick={resetFilters} style={styles.secondaryButton}>Reset</button>
      </div>

      <div style={styles.exportBar}>
        <button onClick={exportFilteredChurches} style={styles.exportButton}>Export Filtered List</button>
        <button onClick={exportTopTen} style={styles.exportButton}>Export Top 10</button>
        <button onClick={exportSelectedChurch} style={styles.exportButton}>Export Selected Church</button>
      </div>

      {loading ? (
        <p>Loading church data...</p>
      ) : (
        <>
          <div style={styles.cardGrid}>
            <SummaryCard title="Churches Shown" value={filtered.length} />
            <SummaryCard title="Total Attendance" value={summary.totalAttendance.toLocaleString()} />
            <SummaryCard title="Baptisms" value={summary.totalBaptisms.toLocaleString()} />
            <SummaryCard title="Total Giving" value={money(summary.totalGiving)} />
            <SummaryCard title="CP Giving" value={money(summary.totalCp)} />
          </div>

          <div style={styles.cardGrid}>
            <SummaryCard title="Growing" value={summary.growing} />
            <SummaryCard title="Plateaued" value={summary.plateaued} />
            <SummaryCard title="Declining" value={summary.declining} />
            <SummaryCard title="Insufficient Data" value={summary.insufficient} />
          </div>

          <div style={styles.cardGrid}>
            <SummaryCard title="Group A Renewal" value={summary.groupA} />
            <SummaryCard title="Group B Strategic" value={summary.groupB} />
            <SummaryCard title="Group C Critical" value={summary.groupC} />
            <SummaryCard title="Group D Data Gap" value={summary.groupD} />
          </div>

          <section style={styles.chartGrid}>
            <div style={styles.chartCard}>
              <h2>Church Health Mix</h2>
              <div style={styles.pieHolder}><Pie data={healthChartData} options={pieOptions} /></div>
            </div>

            <div style={styles.chartCard}>
              <h2>Strategic Action Groups</h2>
              <div style={styles.barHolder}><Bar data={groupChartData} options={barOptions} /></div>
            </div>
          </section>

          <section style={styles.section}>
            <h2>Association Analysis</h2>
            <p>
              <strong>Primary reading:</strong>{' '}
              {summary.declining > summary.growing
                ? 'This field is weighted toward decline and requires strategic prioritization.'
                : 'There are meaningful signs of growth or stability in this field.'}
            </p>
            <p>
              <strong>Most urgent issue:</strong>{' '}
              {summary.groupB + summary.groupC > summary.groupA
                ? 'A large portion of churches are either strategic decliners or critical/replant candidates.'
                : 'There is a strong pool of receptive churches that can be engaged early.'}
            </p>
            <p>
              <strong>Recommended associational posture:</strong> Do not treat every church the same.
              Spend the first 90 days prioritizing receptive churches, strategic decliners, and churches
              where the association can still influence the outcome.
            </p>
          </section>

          {selectedChurchRecord && (
            <section style={styles.highlightSection}>
              <h2>Church Report: {selectedChurchRecord.church_name}</h2>

              <div style={styles.reportGrid}>
                <p><strong>Year:</strong> {selectedChurchRecord.year}</p>
                <p><strong>Association:</strong> {selectedChurchRecord.association}</p>
                <p><strong>Attendance:</strong> {num(selectedChurchRecord.attendance)}</p>
                <p><strong>Baptisms:</strong> {num(selectedChurchRecord.baptisms)}</p>
                <p><strong>Total Giving:</strong> {money(selectedChurchRecord.total_giving)}</p>
                <p><strong>CP Giving:</strong> {money(selectedChurchRecord.cp_giving)}</p>
                <p><strong>Attendance Trend:</strong> {pct(selectedChurchRecord.attendance_trend)}</p>
                <p><strong>Giving Trend:</strong> {pct(selectedChurchRecord.giving_trend)}</p>
                <p><strong>Status:</strong> {classifyChurch(selectedChurchRecord)}</p>
                <p><strong>Renewal Window:</strong> {renewalWindow(selectedChurchRecord)}</p>
                <p><strong>Action Group:</strong> {actionGroup(selectedChurchRecord)}</p>
              </div>

              <h3>Recommended Pathway</h3>
              <p>{pathway(selectedChurchRecord)}</p>

              <h3>Next Step</h3>
              <p>{nextStep(selectedChurchRecord)}</p>

              <h3>Projection</h3>
              <ul>
                <li>3-year attendance projection: {annualProjection(selectedChurchRecord.attendance, selectedChurchRecord.attendance_trend, 3)}</li>
                <li>6-year attendance projection: {annualProjection(selectedChurchRecord.attendance, selectedChurchRecord.attendance_trend, 6)}</li>
                <li>9-year attendance projection: {annualProjection(selectedChurchRecord.attendance, selectedChurchRecord.attendance_trend, 9)}</li>
                <li>{viabilityEstimate(selectedChurchRecord)}</li>
              </ul>

              {selectedChurchHistory.length > 1 && (
                <>
                  <h3>Multi-Year Trend</h3>
                  <div style={styles.chartGrid}>
                    <div style={styles.chartCard}>
                      <h3>Attendance & Baptisms</h3>
                      <div style={styles.lineHolder}><Line data={churchTrendChartData} options={lineOptions} /></div>
                    </div>

                    <div style={styles.chartCard}>
                      <h3>Giving Trends</h3>
                      <div style={styles.lineHolder}><Line data={churchGivingChartData} options={lineOptions} /></div>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          <section style={styles.section}>
            <h2>Top 10 Churches to Engage First</h2>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Rank</th>
                    <th style={styles.th}>Church</th>
                    <th style={styles.th}>Association</th>
                    <th style={styles.th}>Attendance</th>
                    <th style={styles.th}>Trend</th>
                    <th style={styles.th}>Baptisms</th>
                    <th style={styles.th}>CP Giving</th>
                    <th style={styles.th}>Action Group</th>
                  </tr>
                </thead>
                <tbody>
                  {topTen.map((church, index) => (
                    <tr key={church.id}>
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}>{church.church_name}</td>
                      <td style={styles.td}>{church.association}</td>
                      <td style={styles.td}>{num(church.attendance)}</td>
                      <td style={styles.td}>{pct(church.attendance_trend)}</td>
                      <td style={styles.td}>{num(church.baptisms)}</td>
                      <td style={styles.td}>{money(church.cp_giving)}</td>
                      <td style={styles.td}>{actionGroup(church)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section style={styles.section}>
            <h2>90-Day Action Plan</h2>
            <ol>
              <li><strong>Triage:</strong> Focus first on Group A and Group B churches.</li>
              <li><strong>Engage:</strong> Begin with story, trust, and reality-based conversations.</li>
              <li><strong>Assess:</strong> Use a 30-day church assessment before recommending a pathway.</li>
              <li><strong>Align:</strong> Meet with pastors and key leaders around willingness to change.</li>
              <li><strong>Act:</strong> Move churches toward revitalization, fostering, replant, adoption, merger, or legacy planning.</li>
            </ol>
          </section>

          <section style={styles.section}>
            <h2>Church-Level Recommendations</h2>
            <p>Showing <strong>{filtered.length}</strong> churches.</p>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>View</th>
                    <th style={styles.th}>Church</th>
                    <th style={styles.th}>Association</th>
                    <th style={styles.th}>Year</th>
                    <th style={styles.th}>Attendance</th>
                    <th style={styles.th}>Baptisms</th>
                    <th style={styles.th}>Attendance Trend</th>
                    <th style={styles.th}>Giving Trend</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Window</th>
                    <th style={styles.th}>Group</th>
                    <th style={styles.th}>Pathway</th>
                    <th style={styles.th}>Next Step</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map(church => (
                    <tr key={church.id}>
                      <td style={styles.td}>
                        <button
                          style={styles.miniButton}
                          onClick={() => {
                            setSelectedChurch(church.church_name)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                        >
                          View
                        </button>
                      </td>
                      <td style={styles.td}>{church.church_name}</td>
                      <td style={styles.td}>{church.association}</td>
                      <td style={styles.td}>{church.year}</td>
                      <td style={styles.td}>{num(church.attendance)}</td>
                      <td style={styles.td}>{num(church.baptisms)}</td>
                      <td style={styles.td}>{pct(church.attendance_trend)}</td>
                      <td style={styles.td}>{pct(church.giving_trend)}</td>
                      <td style={styles.td}>{classifyChurch(church)}</td>
                      <td style={styles.td}>{renewalWindow(church)}</td>
                      <td style={styles.td}>{actionGroup(church)}</td>
                      <td style={styles.td}>{pathway(church)}</td>
                      <td style={styles.td}>{nextStep(church)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function SummaryCard({ title, value }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={styles.cardValue}>{value}</div>
    </div>
  )
}