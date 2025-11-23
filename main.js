
// main.js — single clean implementation
document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn')
    const clearBtn = document.getElementById('clearBtn')
    const copyBtn = document.getElementById('copyBtn')
    const outputEl = document.getElementById('pccOutput')
    const copyStatus = document.getElementById('copyStatus')

    // per-toggle storage keys will be generated dynamically per container

    function gatherSelections() {
        // return a string that includes both the data-label (if present) and the visible label text
        // so downstream matching can use either the code or the human text (fixes PMV 'check if yes' detection)
        const checks = Array.from(document.querySelectorAll('.categories input[type="checkbox"]'))
        return checks
            .filter(c => c.checked)
            .map(c => `${(c.dataset.label || '').trim()} ${c.parentElement.textContent.trim()}`.trim())
    }

    function buildOrder(selected) {
        if (!selected || !selected.length) return 'No diagnoses selected.'

        // helper to test if any selected item matches a list of codes (loose match)
        const matchesAny = (codes) => selected.some(s => codes.some(c => s === c || s.includes(c)))
        const matchedLabels = (codes) => {
            // from each matched selection return the data-label/code (first token) only
            return selected
                .filter(s => codes.some(c => s === c || s.includes(c)))
                .map(s => (s.split(/\s+/)[0] || '').trim())
                .filter((v, i, arr) => v && arr.indexOf(v) === i)
        }

        // Frequency mapping
        const freqSel = selected.find(s => /5x4|3x4|5x2|6visits/i.test(s)) || ''
        let freqText = ''
        if (/5x4/.test(freqSel)) freqText = '5x/wk x 4wks'
        else if (/3x4/.test(freqSel)) freqText = '3x/wk x 4wks'
        else if (/5x2/.test(freqSel)) freqText = '5x/wk x 2wks'
        else if (/6visits/i.test(freqSel)) freqText = '6 visits in 2 wks'

        // Category code groups
        const dysphagiaCodes = ['R13.12', 'R13.11', 'R13.10', 'I69.391', 'I69.091', 'I69.191', 'I69.291', 'I69.891', 'R13.13', 'R13.14']
        const cogCodes = ['R41.841', 'I69.311', 'I69.319', 'I69.310', 'I69.312', 'I69.314', 'I69.315', 'I69.019', 'I69.119', 'I69.219', 'I69.919']
        const aphasiaCodes = ['R47.01', 'I69.320', 'I69.020', 'I69.120', 'I69.220', 'I69.820']
        const dysarthriaCodes = ['R47.1', 'I69.322', 'I69.122', 'I69.222', 'I69.822']
        const apraxiaCodes = ['I69.390', 'I69.090', 'I69.190', 'I69.290', 'I69.890']
        const otherSpeechCodes = ['I68.328']
        const otherspeechdisturbancesCodes = ['R47.89']

        // R49.8 grouping: if R49.1 (aphonia) is selected, R49.8 groups under aphonia
        // Otherwise, R49.8 groups under dysphonia
        const hasR49_1 = selected.some(s => s.startsWith('R49.1'))
        const hasR49_8 = selected.some(s => s.startsWith('R49.8'))

        const dysphoniaCodes = hasR49_1 && hasR49_8
            ? ['R49.0', 'R49.9']  // Exclude R49.8 from dysphonia when R49.1 is selected
            : ['R49.0', 'R49.8', 'R49.9']
        const aphoniaCodes = hasR49_1 && hasR49_8
            ? ['R49.1', 'R49.8']  // Include R49.8 in aphonia when R49.1 is selected
            : ['R49.1']

        const hasDysphagia = matchesAny(dysphagiaCodes)
        const hasCog = matchesAny(cogCodes)
        const hasAphasia = matchesAny(aphasiaCodes)
        const hasDysarthria = matchesAny(dysarthriaCodes)
        const hasApraxia = matchesAny(apraxiaCodes)
        const hasOtherSpeech = matchesAny(otherSpeechCodes)
        const hasDysphonia = matchesAny(dysphoniaCodes)
        const hasAphonia = matchesAny(aphoniaCodes)
        const hasOtherSpeechDisturbances = matchesAny(otherspeechdisturbancesCodes)

        // Start building the order
        const parts = []
        // Header
        let header = 'ST Clarification: ST Tx up to'
        if (freqText) header += ' ' + freqText
        header += ' for '

        const conds = []
        if (hasDysphagia) conds.push('dysphagia (' + matchedLabels(dysphagiaCodes).join(', ') + ')')
        if (hasCog) conds.push('cognitive deficit (' + matchedLabels(cogCodes).join(', ') + ')')
        if (hasAphasia) conds.push('aphasia (' + matchedLabels(aphasiaCodes).join(', ') + ')')
        if (hasDysarthria) conds.push('dysarthria (' + matchedLabels(dysarthriaCodes).join(', ') + ')')
        if (hasApraxia) conds.push('apraxia (' + matchedLabels(apraxiaCodes).join(', ') + ')')
        if (hasOtherSpeech) conds.push('other speech & lang deficits following stroke (' + matchedLabels(otherSpeechCodes).join(', ') + ')')
        if (hasDysphonia) conds.push('dysphonia (' + matchedLabels(dysphoniaCodes).join(', ') + ')')
        if (hasAphonia) conds.push('aphonia (' + matchedLabels(aphoniaCodes).join(', ') + ')')
        if (hasOtherSpeechDisturbances) conds.push('other speech disturbances (' + matchedLabels(otherspeechdisturbancesCodes).join(', ') + ')')

        header += conds.length ? conds.join(', ') : 'communication / feeding concerns'

        // Which may include
        const includes = []
        if (hasDysphagia) includes.push('oropharyngeal retraining, dysphagia management, PO trials')
        if (hasCog) includes.push('cognitive-linguistic tx, compensatory strategies')
        if (hasAphasia) includes.push('rec/exp language training, word finding strategies')
        if (hasDysarthria || hasApraxia || hasOtherSpeechDisturbances) includes.push('motor speech training, intelligibility strategies')
        if (hasOtherSpeech) includes.push('speech/lang tx')
        if (hasDysphonia || hasAphonia) includes.push('voice tx, vocal strategies')

        // PMV trials detection
        const hasPMV = selected.some(s => /pmv/i.test(s))
        if (hasPMV) includes.push('PMV trials')

        // AAC detection 
        const hasAAC = selected.some(s => /aac/i.test(s))
        if (hasAAC) includes.push('AAC training')

        const includesClause = includes.length ? ' which may include ' + includes.join(', ') : ''

        // CPT codes
        const cptCodes = new Set()
        if (hasDysphagia) cptCodes.add('CPT 92526')
        if (hasCog || hasAphasia || hasDysarthria || hasApraxia || hasOtherSpeech || hasDysphonia || hasAphonia) cptCodes.add('CPT 92507')
        const cptClause = cptCodes.size ? ' ' + Array.from(cptCodes).join(', ') : ''

        // LTG section - collect any checkboxes under elements whose id starts with 'LTG'
        const ltgInputs = Array.from(document.querySelectorAll('[id^="LTG"] input[type="checkbox"]'))
        const ltgSelected = ltgInputs.filter(i => i.checked).map(i => (i.dataset.label || i.parentElement.textContent || '').trim()).filter(Boolean)

        // Separate solids and liquids
        const solids = ['reg7', 'sb6', 'mm5', 'pu4']
        const liquids = ['thins0', 'mt2', 'mo3', 'ex4']

        const selectedSolids = ltgSelected.filter(item => solids.some(s => item.includes(s)))
        const selectedLiquids = ltgSelected.filter(item => liquids.some(l => item.includes(l)))

        // Always list solids before liquids
        const ltgPairs = [...selectedSolids, ...selectedLiquids]
        let ltgClause = ''

        // collect category ids (from the category div ids) for selected speech/cognition groups
        const catIds = []
        if (hasCog) catIds.push('cognition')
        if (hasAphasia) catIds.push('language')
        // group motor-related categories under motor-speech
        if (hasDysarthria || hasApraxia || hasOtherSpeech) catIds.push('motor speech')
        if (hasDysphonia || hasAphonia) catIds.push('voice')
        const deduped = catIds.filter((v, i, arr) => v && arr.indexOf(v) === i)

        // Helper to join domains in sentence format: 'a', 'a & b', 'a, b & c'
        const joinWithAnd = (arr) => {
            if (!arr || !arr.length) return ''
            if (arr.length === 1) return arr[0]
            if (arr.length === 2) return arr[0] + ' & ' + arr[1]
            return arr.slice(0, -1).join(', ') + ' & ' + arr[arr.length - 1]
        }

        // Build LTG clause with diet tolerance first, then improvement goals
        if (ltgPairs.length && deduped.length) {
            // Both diet and speech/cognition goals
            const domainText = joinWithAnd(deduped)
            ltgClause = ' LTG: patient to safely tolerate ' + ltgPairs.join(' & ') + ', patient to improve ' + domainText + ' function to least impairment level.'
        } else if (ltgPairs.length) {
            // Only diet goals
            ltgClause = ' LTG: patient to safely tolerate ' + ltgPairs.join(' & ') + '.'
        } else if (deduped.length) {
            // Only speech/cognition goals
            const domainText = joinWithAnd(deduped)
            ltgClause = ' LTG: patient to improve ' + domainText + ' function to least impairment level.'
        }

        // Ensure CPT clause ends with a period + space when present
        let cptOut = ''
        if (cptClause && cptClause.trim()) {
            cptOut = cptClause.trim() + '. '
        }

        // Normalize LTG clause to end with a period + space when present
        if (ltgClause && ltgClause.trim()) {
            ltgClause = ltgClause.trim().replace(/\.*$/, '') + '. '
        }

        const closing = 'THE THERAPY CLARIFICATION ORDER SERVES AS THE PHYSICIAN CERTIFICATION FOR THE THERAPY PLAN OF CARE.'

        // Build a single-line continuous output (no newlines), using commas not semicolons
        // Ensure there is a space after the first sentence
        let result = header + includesClause + '. ' + (cptOut || '') + (ltgClause || '') + closing
        result = result.replace(/;+/g, ',')

        // Progressive shortening if over 500 characters
        if (result.length > 500) {
            result = result.replace(/oropharyngeal retraining, dysphagia management, PO trials/g, 'dysphagia tx')
        }
        if (result.length > 500) {
            result = result.replace(/motor speech training/g, 'motor speech tx')
        }
        if (result.length > 500) {
            result = result.replace(/motor speech tx, intelligibility strategies/g, 'motor speech tx, intelligibility strats')
        }
        if (result.length > 500) {
            result = result.replace(/motor speech tx, intelligibility strats/g, 'motor speech tx')
        }
        if (result.length > 500) {
            result = result.replace(/rec\/exp language training, word finding strategies/g, 'language tx, word finding strats')
        }
        if (result.length > 500) {
            result = result.replace(/language tx, word finding strats/g, 'language tx')
        }
        if (result.length > 500) {
            result = result.replace(/cognitive-linguistic tx/g, 'cog tx')
        }
        if (result.length > 500) {
            result = result.replace(/cog tx, compensatory strategies/g, 'cog tx, compensatory strats')
        }
        if (result.length > 500) {
            result = result.replace(/cog tx, compensatory strats/g, 'cog tx')
        }
        if (result.length > 500) {
            result = result.replace(/language, motor speech/g, 'communication')
        }
        if (result.length > 500) {
            result = result.replace(/cognition, communication & voice/g, 'cognition & communication')
        }
        if (result.length > 500) {
            result = result.replace(/other speech disturbances/g, 'speech deficit')
        }
        if (result.length > 500) {
            result = result.replace(/other speech & lang deficits following stroke/g, 'speech/lang deficits from cva')
        }
        if (result.length > 500) {
            result = result.replace(/other speech & lang deficits following stroke/g, 'speech/lang deficits from cva')
        }
        if (result.length > 500) {
            result = result.replace(/language tx, motor speech tx, voice tx/g, 'communication tx')
        }
        if (result.length > 500) {
            result = result.replace(/language tx, motor speech tx/g, 'communication tx')
        }
        if (result.length > 500) {
            result = result.replace(/safely /g, '')
        }


        return result
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const sel = gatherSelections()
            outputEl.value = buildOrder(sel)
            copyStatus.textContent = ''
            outputEl.focus()
            // update char count after generating
            const cntEl = document.getElementById('charCount')
            if (cntEl) cntEl.textContent = String(outputEl.value.length)
        })
    }

    // update char count live when user edits the textarea
    const charEl = document.getElementById('charCount')
    if (charEl && outputEl) {
        const update = () => { charEl.textContent = String(outputEl.value.length) }
        outputEl.addEventListener('input', update)
        // initialize
        update()
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            document.querySelectorAll('.categories input[type="checkbox"]').forEach(c => c.checked = false)
            outputEl.value = ''
            copyStatus.textContent = ''
        })
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const text = outputEl.value
            if (!text) {
                copyStatus.textContent = 'Nothing to copy.'
                return
            }
            try {
                await navigator.clipboard.writeText(text)
                copyStatus.textContent = 'Copied to clipboard.'
                setTimeout(() => (copyStatus.textContent = ''), 2500)
            } catch (err) {
                outputEl.select()
                try {
                    document.execCommand('copy')
                    copyStatus.textContent = 'Copied to clipboard.'
                    setTimeout(() => (copyStatus.textContent = ''), 2500)
                } catch (err2) {
                    copyStatus.textContent = 'Copy failed. Please select and copy manually.'
                }
            }
        })
    }

    // keyboard support for checkboxes
    document.querySelectorAll('.categories input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('keydown', e => {
            if (e.key === 'Enter') generateBtn && generateBtn.click()
        })
    })

    // wire up any .more-toggle buttons found inside categories
    document.querySelectorAll('.category .more-toggle').forEach(toggle => {
        const targetId = toggle.getAttribute('aria-controls')
        if (!targetId) return
        const container = document.getElementById(targetId)
        if (!container) return

        const key = `slp:more:${targetId}`
        const isOpen = localStorage.getItem(key) === '1'
        toggle.setAttribute('aria-expanded', String(isOpen))
        toggle.textContent = isOpen ? 'Show less' : 'Show more'
        container.classList.toggle('open', isOpen)
        container.setAttribute('aria-hidden', String(!isOpen))

        toggle.addEventListener('click', () => {
            const expanded = toggle.getAttribute('aria-expanded') === 'true'
            const next = !expanded
            toggle.setAttribute('aria-expanded', String(next))
            toggle.textContent = next ? 'Show less' : 'Show more'
            container.classList.toggle('open', next)
            container.setAttribute('aria-hidden', String(!next))
            localStorage.setItem(key, next ? '1' : '0')
        })
    })

    // Initialize productivity calculator if on page
    if (document.getElementById('productivity-tbody')) {
        initProductivityCalculator()
    }
})

// Local storage functions for productivity data
function saveProductivityData() {
    const data = {
        rows: [],
        workHours: parseInt(document.getElementById('work-hours')?.value) || 8,
        workMinutes: parseInt(document.getElementById('work-minutes')?.value) || 0
    }

    // Save all patient names and minutes
    document.querySelectorAll('.patient-input').forEach((input, index) => {
        if (!data.rows[index]) data.rows[index] = {}
        data.rows[index].patient = input.value
    })

    document.querySelectorAll('.minutes-input').forEach((input, index) => {
        if (!data.rows[index]) data.rows[index] = {}
        data.rows[index].minutes = input.value
    })

    localStorage.setItem('slp-productivity-data', JSON.stringify(data))
}

function loadProductivityData() {
    try {
        const saved = localStorage.getItem('slp-productivity-data')
        if (saved) {
            return JSON.parse(saved)
        }
    } catch (e) {
        console.error('Error loading productivity data:', e)
    }
    return { rows: [], workHours: 8, workMinutes: 0 }
}

// Productivity Calculator functionality
function initProductivityCalculator() {
    // Track selected cells
    let selectedCells = new Set()
    let isSelecting = false
    let shiftKeyDown = false
    let lastSelectedCell = null

    // Initialize the productivity grid
    const tbody = document.getElementById('productivity-tbody')

    // Load saved data from localStorage
    const savedData = loadProductivityData()

    // Create 12 rows
    for (let i = 1; i <= 12; i++) {
        const row = document.createElement('tr')

        // Column 1: Row number (static)
        const numCell = document.createElement('td')
        numCell.textContent = i
        numCell.className = 'row-number'
        row.appendChild(numCell)

        // Column 2: Patient name (editable)
        const patientCell = document.createElement('td')
        patientCell.className = 'editable-cell'
        const patientInput = document.createElement('input')
        patientInput.type = 'text'
        patientInput.className = 'patient-input'
        patientInput.placeholder = 'Patient name/initials'
        patientInput.dataset.row = i - 1
        patientInput.dataset.col = 0
        // Load saved value
        if (savedData.rows[i - 1]) {
            patientInput.value = savedData.rows[i - 1].patient || ''
        }
        patientInput.addEventListener('input', saveProductivityData)
        patientInput.addEventListener('keydown', handleArrowKeys)
        patientInput.addEventListener('mousedown', handleCellMouseDown)
        patientInput.addEventListener('mouseenter', handleCellMouseEnter)
        patientInput.addEventListener('focus', handleCellFocus)
        patientCell.appendChild(patientInput)
        row.appendChild(patientCell)

        // Column 3: Minutes (editable)
        const minutesCell = document.createElement('td')
        minutesCell.className = 'editable-cell'
        const minutesInput = document.createElement('input')
        minutesInput.type = 'number'
        minutesInput.className = 'minutes-input'
        minutesInput.min = '0'
        minutesInput.value = ''
        minutesInput.placeholder = '0'
        minutesInput.dataset.row = i - 1
        minutesInput.dataset.col = 1
        // Load saved value
        if (savedData.rows[i - 1]) {
            minutesInput.value = savedData.rows[i - 1].minutes || ''
        }
        minutesInput.addEventListener('input', () => {
            calculateProductivity()
            saveProductivityData()
        })
        minutesInput.addEventListener('keydown', handleArrowKeys)
        minutesInput.addEventListener('mousedown', handleCellMouseDown)
        minutesInput.addEventListener('mouseenter', handleCellMouseEnter)
        minutesInput.addEventListener('focus', handleCellFocus)
        minutesCell.appendChild(minutesInput)
        row.appendChild(minutesCell)

        tbody.appendChild(row)
    }

    // Focus on the first minutes input
    const firstMinutesInput = tbody.querySelector('.minutes-input')
    if (firstMinutesInput) {
        firstMinutesInput.focus()
    }

    // Global mouse up listener
    document.addEventListener('mouseup', () => {
        isSelecting = false
    })

    // Track shift key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') shiftKeyDown = true
        // Delete key clears selected cells when multiple cells are selected
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCells.size > 1) {
            e.preventDefault()
            clearSelectedCells()
        }
    })

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') shiftKeyDown = false
    })

    // Handle cell mouse down for multi-select
    function handleCellMouseDown(e) {
        const input = e.target

        if (e.ctrlKey || e.metaKey) {
            // Toggle selection with Ctrl/Cmd
            e.preventDefault()
            toggleCellSelection(input)
            isSelecting = true
            lastSelectedCell = input
        } else if (shiftKeyDown && lastSelectedCell) {
            // Range selection with Shift
            e.preventDefault()
            selectRange(lastSelectedCell, input)
            lastSelectedCell = input
        } else {
            // Start drag selection
            clearSelection()
            addCellToSelection(input)
            isSelecting = true
            lastSelectedCell = input
        }
    }

    // Handle mouse enter during drag selection
    function handleCellMouseEnter(e) {
        if (isSelecting && e.buttons === 1) {
            e.preventDefault()
            const input = e.target
            if (input.tagName === 'INPUT' && (input.classList.contains('patient-input') || input.classList.contains('minutes-input'))) {
                addCellToSelection(input)
            }
        }
    }

    // Handle cell focus
    function handleCellFocus(e) {
        if (selectedCells.size === 0 || (!e.ctrlKey && !e.metaKey && !shiftKeyDown)) {
            // Normal focus behavior when no multi-select keys pressed
            if (!e.target.classList.contains('selected')) {
                clearSelection()
            }
        }
    }

    // Toggle cell selection
    function toggleCellSelection(input) {
        const cellId = `${input.dataset.row}-${input.dataset.col}`
        if (selectedCells.has(cellId)) {
            selectedCells.delete(cellId)
            input.classList.remove('selected')
        } else {
            selectedCells.add(cellId)
            input.classList.add('selected')
        }
        updateClearSelectedButton()
    }

    // Add cell to selection
    function addCellToSelection(input) {
        const cellId = `${input.dataset.row}-${input.dataset.col}`
        selectedCells.add(cellId)
        input.classList.add('selected')
        updateClearSelectedButton()
    }

    // Select range between two cells
    function selectRange(fromInput, toInput) {
        clearSelection()

        const fromRow = parseInt(fromInput.dataset.row)
        const fromCol = parseInt(fromInput.dataset.col)
        const toRow = parseInt(toInput.dataset.row)
        const toCol = parseInt(toInput.dataset.col)

        const minRow = Math.min(fromRow, toRow)
        const maxRow = Math.max(fromRow, toRow)
        const minCol = Math.min(fromCol, toCol)
        const maxCol = Math.max(fromCol, toCol)

        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                const input = document.querySelector(`input[data-row="${row}"][data-col="${col}"]`)
                if (input) {
                    addCellToSelection(input)
                }
            }
        }
    }

    // Clear selection
    function clearSelection() {
        document.querySelectorAll('.selected').forEach(input => {
            input.classList.remove('selected')
        })
        selectedCells.clear()
        updateClearSelectedButton()
    }

    // Clear selected cells
    function clearSelectedCells() {
        document.querySelectorAll('.selected').forEach(input => {
            input.value = ''
        })
        clearSelection()
        calculateProductivity()
        saveProductivityData()
    }

    // Clear all cells
    function clearAllCells() {
        document.querySelectorAll('.patient-input, .minutes-input').forEach(input => {
            input.value = ''
        })
        clearSelection()
        calculateProductivity()
        saveProductivityData()
    }

    // Update clear selected button state
    function updateClearSelectedButton() {
        const clearSelectedBtn = document.getElementById('clear-selected-btn')
        if (clearSelectedBtn) {
            clearSelectedBtn.disabled = selectedCells.size === 0
        }
    }

    // Handle arrow key navigation
    function handleArrowKeys(e) {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            return
        }

        e.preventDefault()

        const currentRow = parseInt(e.target.dataset.row)
        const currentCol = parseInt(e.target.dataset.col)
        let newRow = currentRow
        let newCol = currentCol

        // Calculate new position
        switch (e.key) {
            case 'ArrowUp':
                newRow = Math.max(0, currentRow - 1)
                break
            case 'ArrowDown':
                newRow = Math.min(11, currentRow + 1)
                break
            case 'ArrowLeft':
                newCol = Math.max(0, currentCol - 1)
                break
            case 'ArrowRight':
                newCol = Math.min(1, currentCol + 1)
                break
        }

        // Find and focus the target input
        const targetInput = document.querySelector(`input[data-row="${newRow}"][data-col="${newCol}"]`)
        if (targetInput) {
            if (!shiftKeyDown) {
                clearSelection()
                lastSelectedCell = targetInput
            } else {
                // Extend selection with shift + arrow
                if (!lastSelectedCell) lastSelectedCell = e.target
                selectRange(lastSelectedCell, targetInput)
                // Don't update lastSelectedCell when extending so we keep the anchor point
            }
            targetInput.focus()
            if (!shiftKeyDown) {
                targetInput.select()
            }
        }
    }

    // Calculate productivity
    function calculateProductivity() {
        const minutesInputs = document.querySelectorAll('.minutes-input')
        const workHoursInput = document.getElementById('work-hours')
        const workMinutesInput = document.getElementById('work-minutes')

        // Calculate total treatment minutes
        let totalMinutes = 0
        minutesInputs.forEach(input => {
            const value = parseFloat(input.value) || 0
            totalMinutes += value
        })

        // Convert to hours and minutes
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60

        // Update treatment minutes display
        const treatmentMinutesEl = document.getElementById('treatment-minutes')
        if (treatmentMinutesEl) {
            treatmentMinutesEl.textContent = `${hours} hrs ${minutes} minutes`
        }

        // Calculate productivity percentage
        const workHours = parseFloat(workHoursInput?.value) || 0
        const workMinutes = parseFloat(workMinutesInput?.value) || 0
        const totalWorkMinutes = (workHours * 60) + workMinutes
        const productivityPercentage = totalWorkMinutes > 0 ? (totalMinutes / totalWorkMinutes * 100) : 0

        // Update productivity display
        const productivityEl = document.getElementById('productivity-percentage')
        if (productivityEl) {
            productivityEl.textContent = `${productivityPercentage.toFixed(2)}%`
        }
    }

    // Add event listeners to work hours and minutes inputs
    const workHoursInput = document.getElementById('work-hours')
    const workMinutesInput = document.getElementById('work-minutes')
    const clockWorkHoursInput = document.getElementById('clock-work-hours')
    const clockWorkMinutesInput = document.getElementById('clock-work-minutes')

    // Load saved work hours
    if (workHoursInput && savedData.workHours !== undefined) {
        workHoursInput.value = savedData.workHours
    }
    if (workMinutesInput && savedData.workMinutes !== undefined) {
        workMinutesInput.value = savedData.workMinutes
    }
    if (clockWorkHoursInput && savedData.workHours !== undefined) {
        clockWorkHoursInput.value = savedData.workHours
    }
    if (clockWorkMinutesInput && savedData.workMinutes !== undefined) {
        clockWorkMinutesInput.value = savedData.workMinutes
    }

    if (workHoursInput) {
        workHoursInput.addEventListener('input', () => {
            calculateProductivity()
            saveProductivityData()
            // Sync with clock inputs
            if (clockWorkHoursInput) {
                clockWorkHoursInput.value = workHoursInput.value
                calculateClockOut()
            }
        })
    }
    if (workMinutesInput) {
        workMinutesInput.addEventListener('input', () => {
            calculateProductivity()
            saveProductivityData()
            // Sync with clock inputs
            if (clockWorkMinutesInput) {
                clockWorkMinutesInput.value = workMinutesInput.value
                calculateClockOut()
            }
        })
    }
    if (clockWorkHoursInput) {
        clockWorkHoursInput.addEventListener('input', () => {
            // Sync with productivity inputs
            if (workHoursInput) {
                workHoursInput.value = clockWorkHoursInput.value
                calculateProductivity()
                saveProductivityData()
            }
            calculateClockOut()
        })
    }
    if (clockWorkMinutesInput) {
        clockWorkMinutesInput.addEventListener('input', () => {
            // Sync with productivity inputs
            if (workMinutesInput) {
                workMinutesInput.value = clockWorkMinutesInput.value
                calculateProductivity()
                saveProductivityData()
            }
            calculateClockOut()
        })
    }

    // Clear all button
    const clearAllBtn = document.getElementById('clear-all-btn')
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllCells)
    }

    // Clear selected button
    const clearSelectedBtn = document.getElementById('clear-selected-btn')
    if (clearSelectedBtn) {
        clearSelectedBtn.addEventListener('click', clearSelectedCells)
    }

    // Initial calculation
    calculateProductivity()

    // Initialize time clock
    initTimeClock()
}

// Time Clock functionality
function initTimeClock() {
    // Update current time and date
    updateCurrentTime()
    setInterval(updateCurrentTime, 1000)

    // Add event listeners for clock calculations
    const clockInInput = document.getElementById('clock-in-input')
    const lunchBreakInput = document.getElementById('lunch-break-input')

    if (clockInInput) clockInInput.addEventListener('input', calculateClockOut)
    if (lunchBreakInput) lunchBreakInput.addEventListener('input', calculateClockOut)

    // Calculate clock-out time on page load with default values
    calculateClockOut()
}

function updateCurrentTime() {
    const now = new Date()
    const currentTimeEl = document.getElementById('current-time')
    const currentDateEl = document.getElementById('current-date')

    if (currentTimeEl) {
        // Update time (HH:MM)
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: true,
            hour: 'numeric',
            minute: '2-digit'
        })
        currentTimeEl.textContent = timeString
    }

    if (currentDateEl) {
        // Update date
        const dateString = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        currentDateEl.textContent = dateString
    }
}

function calculateClockOut() {
    const clockInInput = document.getElementById('clock-in-input')
    const clockWorkHoursInput = document.getElementById('clock-work-hours')
    const clockWorkMinutesInput = document.getElementById('clock-work-minutes')
    const lunchBreakInput = document.getElementById('lunch-break-input')
    const calculatedClockOutEl = document.getElementById('calculated-clock-out')

    if (!clockInInput || !clockWorkHoursInput || !clockWorkMinutesInput || !lunchBreakInput || !calculatedClockOutEl) {
        return
    }

    const clockInValue = clockInInput.value
    const workHours = parseFloat(clockWorkHoursInput.value) || 0
    const workMinutes = parseFloat(clockWorkMinutesInput.value) || 0
    const lunchBreakMinutes = parseFloat(lunchBreakInput.value) || 0

    if (!clockInValue || (workHours === 0 && workMinutes === 0)) {
        calculatedClockOutEl.textContent = '--:--'
        return
    }

    // Parse clock-in time
    const [hours, minutes] = clockInValue.split(':').map(Number)
    const clockInDate = new Date()
    clockInDate.setHours(hours, minutes, 0, 0)

    // Calculate total minutes at work (work hours + work minutes + lunch break)
    const totalWorkMinutes = (workHours * 60) + workMinutes + lunchBreakMinutes

    // Calculate clock-out time
    const clockOutDate = new Date(clockInDate.getTime() + (totalWorkMinutes * 60000))

    // Format clock-out time
    const clockOutString = clockOutDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })

    calculatedClockOutEl.textContent = clockOutString
}

