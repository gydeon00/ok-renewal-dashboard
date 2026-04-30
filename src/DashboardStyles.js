export const styles = {
    page: { padding: 24, fontFamily: 'Arial, sans-serif', background: '#f6f7f9', color: '#111827', minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' },
    title: { margin: 0, fontSize: 34 },
    subtitle: { marginTop: 8, color: '#4b5563' },
  
    filters: { display: 'flex', gap: 16, alignItems: 'end', flexWrap: 'wrap', background: '#fff', padding: 16, borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    field: { display: 'flex', flexDirection: 'column', minWidth: 180 },
    fieldWide: { display: 'flex', flexDirection: 'column', minWidth: 420 },
    label: { fontWeight: 700, marginBottom: 6 },
    input: { padding: 10, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 15 },
  
    primaryButton: { padding: '10px 16px', borderRadius: 8, border: 'none', background: '#7f1d1d', color: '#fff', fontWeight: 700, cursor: 'pointer' },
    secondaryButton: { padding: '10px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontWeight: 700, cursor: 'pointer' },
    miniButton: { padding: '6px 10px', borderRadius: 6, border: 'none', background: '#7f1d1d', color: '#fff', cursor: 'pointer' },
  
    exportBar: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 },
    exportButton: { padding: '10px 14px', borderRadius: 8, border: '1px solid #7f1d1d', background: '#fff', color: '#7f1d1d', fontWeight: 700, cursor: 'pointer' },
  
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 },
    card: { background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    cardTitle: { fontSize: 13, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 },
    cardValue: { fontSize: 26, fontWeight: 800, marginTop: 8 },
  
    section: { background: '#fff', padding: 18, borderRadius: 12, marginTop: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    highlightSection: { background: '#fff7ed', border: '1px solid #fed7aa', padding: 18, borderRadius: 12, marginTop: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  
    chartGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginTop: 20 },
    chartCard: { background: '#fff', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: 360 },
    pieHolder: { height: 280, maxWidth: 420, margin: '0 auto' },
    barHolder: { height: 280, width: '100%' },
    lineHolder: { height: 280, width: '100%' },
  
    reportGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 },
    tableWrap: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
    th: { background: '#f3f4f6', border: '1px solid #d1d5db', padding: 10, textAlign: 'left', whiteSpace: 'nowrap' },
    td: { border: '1px solid #e5e7eb', padding: 10, verticalAlign: 'top' },
  }