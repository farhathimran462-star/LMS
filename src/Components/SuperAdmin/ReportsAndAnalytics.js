export const styles = {
    // --- Chart Colors (Mapped to new Semantic/Brand Colors) ---
    // These colors are used for chart elements (Bars, Pie Slices)
    colors: {
        // Pass/Fail for Pie Chart
        Pass: 'var(--color-success)', 
        Fail: 'var(--color-error)',
        // Bar chart metrics
        Attendance: 'var(--color-warning)', 
        Marks: 'var(--brand-pink)', // Using the primary brand color for the main metric
    },

    // --- Overall Layout Styles ---
    dashboardStyle: {
        padding: 'var(--space-8)',
        backgroundColor: 'var(--color-gray-100)',
        minHeight: '100vh',
        fontFamily: 'var(--font-primary)',
    },
    titleStyle: {
        color: 'var(--color-gray-900)',
        // Using brand pink for the underline border
        borderBottom: `4px solid var(--brand-pink)`, 
        paddingBottom: 'var(--space-4)',
        marginBottom: 'var(--space-4)',
        fontSize: 'var(--font-size-3xl)',
        fontWeight: 'var(--font-weight-semibold)',
    },
    selectedTitleStyle: {
        color: 'var(--color-gray-700)',
        fontSize: 'var(--font-size-xl)',
        margin: 'var(--space-4) 0 var(--space-2) 0',
    },

    // --- Filter Styles ---
    filterBoxStyle: {
        backgroundColor: 'var(--color-white)',
        padding: 'var(--space-5)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: 'var(--space-8)',
        border: '1px solid var(--color-gray-300)',
    },
    filterGroup: {
        display: 'flex',
        alignItems: 'center',
        marginRight: 'var(--space-8)',
        position: 'relative',
    },
    filterRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-5)',
    },
    labelStyle: {
        fontWeight: 'var(--font-weight-medium)',
        color: 'var(--color-gray-700)',
        marginRight: 'var(--space-2)',
        whiteSpace: 'nowrap',
        fontSize: 'var(--font-size-sm)',
    },
    selectStyle: {
        padding: 'var(--space-3) var(--space-4)',
        paddingRight: '35px', // Space for the clear button
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-gray-300)',
        minWidth: '280px',
        fontSize: 'var(--font-size-base)',
        backgroundColor: 'var(--color-white)',
        color: 'var(--color-gray-900)',
        appearance: 'none',
        height: '42px', 
    },
    clearButtonStyle: {
        position: 'absolute',
        right: '5px',
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: 'transparent',
        border: 'none',
        color: 'var(--color-error)',
        cursor: 'pointer',
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-bold)',
        padding: '0 5px',
        lineHeight: '1',
        zIndex: 10,
    },

    // --- Grid Layout Styles ---
    twoColumnGridStyle: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--space-8)',
        marginBottom: 'var(--space-8)',
    },
    horizontalReportStyle: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: 'var(--space-8)',
    },

    // --- Card/Chart Styles ---
    chartCardStyle: {
        backgroundColor: 'var(--color-white)',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-gray-200)',
        overflowX: 'auto',
    },
    cardTitleStyle: {
        color: 'var(--color-gray-900)',
        marginBottom: 'var(--space-2)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 'var(--font-weight-semibold)',
        borderLeft: `5px solid var(--brand-pink-dark)`, // Darker brand pink for accent
        paddingLeft: 'var(--space-3)',
    },
    cardSubtitleStyle: {
        color: 'var(--color-gray-700)',
        marginBottom: 'var(--space-5)',
        fontSize: 'var(--font-size-sm)',
    },
    summaryValue: {
        fontSize: 'var(--font-size-4xl)', 
        fontWeight: 'var(--font-weight-bold)',
        color: 'var(--brand-pink)', // Brand color for key numbers
    },
    summaryLabel: {
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-gray-700)',
        marginTop: 'var(--space-2)',
        fontWeight: 'var(--font-weight-medium)',
    },
};