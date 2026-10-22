
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
        const freqSel = selected.find(s => /5x4|3x4|5x3|6visits2wk|6visits4wk/i.test(s)) || ''
        let freqText = ''
        if (/5x4/.test(freqSel)) freqText = '5x/wk x 4wks'
        else if (/3x4/.test(freqSel)) freqText = '3x/wk x 4wks'
        else if (/5x3/.test(freqSel)) freqText = '5x/wk x 3wks'
        else if (/6visits2wk/i.test(freqSel)) freqText = '6 visits in 2 wks'
        else if (/6visits4wk/i.test(freqSel)) freqText = '6 visits in 4 wks'

        // Category code groups
        const dysphagiaCodes = ['R13.12', 'R13.11', 'R13.10', 'I69.391', 'I69.091', 'I69.191', 'I69.291', 'I69.891', 'R13.13', 'R13.14']
        const cogCodes = ['R41.841', 'I69.311', 'R41.9', 'I69.319', 'I69.310', 'I69.312', 'I69.314', 'I69.315', 'I69.019', 'I69.119', 'I69.219', 'I69.919']
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
            ? ['R49.0']  // Exclude R49.8 from dysphonia when R49.1 is selected
            : ['R49.0', 'R49.8']
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

        // Oral gratification detection
        const hasOralGrat = selected.some(s => /oralgrat/i.test(s))

        // Improve PO intake detection
        const hasImprovePO = selected.some(s => /improvepo/i.test(s))

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
        const liquids = ['th0', 'mt2', 'mo3', 'ex4']

        const selectedSolids = ltgSelected.filter(item => solids.some(s => item.includes(s)))
        const selectedLiquids = ltgSelected.filter(item => liquids.some(l => item.includes(l)))

        // When more than one consistency is selected within a group (solid or liquid),
        // express them as a single slash-joined term in ascending order (e.g. sb6/reg7)
        const byAscendingLevel = (arr) => [...arr].sort((a, b) => {
            const numA = parseInt((a.match(/\d+/) || [0])[0], 10)
            const numB = parseInt((b.match(/\d+/) || [0])[0], 10)
            return numA - numB
        })
        const solidText = selectedSolids.length > 1 ? byAscendingLevel(selectedSolids).join('/') : (selectedSolids[0] || '')
        const liquidText = selectedLiquids.length > 1 ? byAscendingLevel(selectedLiquids).join('/') : (selectedLiquids[0] || '')

        // Always list solids before liquids
        const ltgPairs = [solidText, liquidText].filter(Boolean)
        let ltgClause = ''

        // collect category ids (from the category div ids) for selected speech/cognition groups
        const catIds = []
        if (hasCog) catIds.push('cognition')
        if (hasAphasia) catIds.push('language')
        // group motor-related categories under motor-speech
        if (hasDysarthria || hasApraxia || hasOtherSpeech || hasOtherSpeechDisturbances) catIds.push('motor speech')
        if (hasDysphonia || hasAphonia) catIds.push('voice')
        const deduped = catIds.filter((v, i, arr) => v && arr.indexOf(v) === i)

        // Helper to join domains in sentence format: 'a', 'a & b', 'a, b & c'
        const joinWithAnd = (arr) => {
            if (!arr || !arr.length) return ''
            if (arr.length === 1) return arr[0]
            if (arr.length === 2) return arr[0] + ' and ' + arr[1]
            return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]
        }

        // Build LTG clause with diet tolerance first, then improvement goals
        const dietText = (hasOralGrat ? 'an oral gratification diet of ' : '') + ltgPairs.join(' and ') + (hasImprovePO ? ' to improve PO intake' : '')
        if (ltgPairs.length && deduped.length) {
            // Both diet and speech/cognition goals
            const domainText = joinWithAnd(deduped)
            ltgClause = ' LTG: Patient to improve swallow function to safely tolerate ' + dietText + ', patient to improve ' + domainText + ' function to least impairment level.'
        } else if (ltgPairs.length) {
            // Only diet goals
            ltgClause = ' LTG: Patient to improve swallow function to safely tolerate ' + dietText + '.'
        } else if (deduped.length) {
            // Only speech/cognition goals
            const domainText = joinWithAnd(deduped)
            ltgClause = ' LTG: Patient to improve ' + domainText + ' function to least impairment level.'
        }

        // Expand voice goal to include functional communication phrase
        if (ltgClause) {
            ltgClause = ltgClause.replace(
                /voice function to least impairment level/g,
                'voice function to improve functional communication to least impairment level'
            )
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
        if (result.length > 500) {
            result = result.replace(/gratification/g, 'grat')
        }
        if (result.length > 500) {
            result = result.replace(/to improve functional communication /g, '')
        }
        if (result.length > 500) {
            result = result.replace(/improve swallow function to/g, 'safely')
        }


        return result
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const sel = gatherSelections()
            outputEl.value = buildOrder(sel)
            copyStatus.textContent = ''
            outputEl.focus()

            // Build combined warning messages
            const warningBox = document.getElementById('warningBox')
            if (warningBox) {
                const messages = []
                const dysphagiaCodes = ['R13.12', 'R13.11', 'R13.10', 'I69.391', 'I69.091', 'I69.191', 'I69.291', 'I69.891', 'R13.13', 'R13.14']
                const hasDysph = sel.some(s => dysphagiaCodes.some(c => s.includes(c)))
                const ltgInputs = Array.from(document.querySelectorAll('[id^="LTG"] input[type="checkbox"]'))
                const hasLTGDiet = ltgInputs.some(i => i.checked)

                const dxInputs = Array.from(document.querySelectorAll('#dysphagia input[type="checkbox"], #cognition input[type="checkbox"], #language input[type="checkbox"], #motor-speech input[type="checkbox"], #voice input[type="checkbox"]'))
                const hasAnyDx = dxInputs.some(i => i.checked)
                if (!hasAnyDx) messages.push('Message: No dx is selected.')

                if (hasAnyDx && hasLTGDiet && !hasDysph) messages.push('Message: No dysphagia dx is selected for LTG diet.')
                if (hasDysph && !hasLTGDiet) messages.push('Message: No LTG diet selected for dysphagia tx.')

                const freqChecked = Array.from(document.querySelectorAll('#Freq input[type="checkbox"]')).filter(i => i.checked)
                if (freqChecked.length === 0) messages.push('Message: No Frequency of Tx selected.')
                else if (freqChecked.length > 1) messages.push('Message: More than one frequency of tx is selected.')

                const solidCodes = ['reg7', 'sb6', 'mm5', 'pu4']
                const liquidCodes = ['th0', 'mt2', 'mo3', 'ex4']
                const solidChecked = ltgInputs.filter(i => i.checked && solidCodes.includes(i.dataset.label))
                const liquidChecked = ltgInputs.filter(i => i.checked && liquidCodes.includes(i.dataset.label))
                if (solidChecked.length > 1) messages.push('Message: More than one solid consistency is selected in LTG diet.')
                if (liquidChecked.length > 1) messages.push('Message: More than one liquid consistency is selected in LTG diet.')

                if (messages.length) {
                    warningBox.innerHTML = messages.join('<br>')
                    warningBox.hidden = false
                } else {
                    warningBox.hidden = true
                }
            }
            // update char count after generating
            const cntEl = document.getElementById('charCount')
            if (cntEl) cntEl.textContent = String(outputEl.value.length)
            // Save to localStorage after generation
            savePCCSelections()
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
            // Clear warning messages
            const warningBox = document.getElementById('warningBox')
            if (warningBox) {
                warningBox.innerHTML = ''
                warningBox.hidden = true
            }
            // Clear character count
            const cntEl = document.getElementById('charCount')
            if (cntEl) cntEl.textContent = '0'
            // Clear localStorage as well
            clearPCCSelections()
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

    // keyboard support for checkboxes and auto-save
    document.querySelectorAll('.categories input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('keydown', e => {
            if (e.key === 'Enter') generateBtn && generateBtn.click()
        })
        // Auto-save when checkbox changes
        cb.addEventListener('change', savePCCSelections)
    })

    // Load saved PCC selections on page load (only on index.html)
    if (document.querySelector('.categories')) {
        const savedPCC = loadPCCSelections()

        // Restore checkbox states
        document.querySelectorAll('.categories input[type="checkbox"]').forEach(cb => {
            const id = cb.id || cb.dataset.label || cb.parentElement.textContent.trim()
            if (savedPCC.checkboxes[id] !== undefined) {
                cb.checked = savedPCC.checkboxes[id]
            }
        })

        // Restore output text
        if (outputEl && savedPCC.output) {
            outputEl.value = savedPCC.output
            // Update char count
            const cntEl = document.getElementById('charCount')
            if (cntEl) cntEl.textContent = String(outputEl.value.length)
        }
    }

    // Save output when it changes (user edits or generation)
    if (outputEl) {
        outputEl.addEventListener('input', savePCCSelections)
    }

    // wire up any .more-toggle buttons found inside categories
    document.querySelectorAll('.category .more-toggle').forEach(toggle => {
        const targetId = toggle.getAttribute('aria-controls')
        if (!targetId) return
        const container = document.getElementById(targetId)
        if (!container) return

        toggle.setAttribute('aria-expanded', 'false')
        toggle.textContent = 'Show more'
        container.classList.remove('open')
        container.setAttribute('aria-hidden', 'true')

        toggle.addEventListener('click', () => {
            const expanded = toggle.getAttribute('aria-expanded') === 'true'
            const next = !expanded
            toggle.setAttribute('aria-expanded', String(next))
            toggle.textContent = next ? 'Show less' : 'Show more'
            container.classList.toggle('open', next)
            container.setAttribute('aria-hidden', String(!next))
        })
    })

    // Initialize productivity calculator if on page
    if (document.getElementById('productivity-tbody')) {
        initProductivityCalculator()
    }

    // Initialize BIMS scorer if on page
    if (document.getElementById('bims-total')) {
        initBIMS()
    }

    // Initialize BCRS scorer if on page
    if (document.getElementById('bcrs-total')) {
        initBCRS()
    }

    // Initialize SLUMS scorer if on page
    if (document.getElementById('slums-total')) {
        initSLUMS()
    }

    // Initialize MoCA scorer if on page
    if (document.getElementById('moca-total')) {
        initMOCA()
    }
})

function initMOCA() {
    const items = document.querySelectorAll('.bims-item[data-question]')
    const parts = document.querySelectorAll('.bims-part')
    const educationRow = document.getElementById('moca-education')
    const recallKeys = ['face', 'velvet', 'church', 'daisy', 'red']
    const scores = {}
    const mis = {}
    let educationPoint = 0

    // Recall buttons share a point value, so identify them by their MIS weight
    const choiceId = btn => btn.dataset.mis ?? btn.dataset.value

    function sum(obj, keys) {
        return keys.reduce((total, k) => total + obj[k], 0)
    }

    // Serial 7s: 4–5 correct = 3 pts, 2–3 = 2 pts, 1 = 1 pt, 0 = 0 pts
    const serialKeys = ['serial7a', 'serial7b', 'serial7c', 'serial7d', 'serial7e']
    const serialPoints = correct => correct >= 4 ? 3 : correct >= 2 ? 2 : correct

    function points(keys) {
        const serial = keys.filter(k => serialKeys.includes(k))
        const other = keys.filter(k => !serialKeys.includes(k))
        return sum(scores, other) + (serial.length ? serialPoints(sum(scores, serial)) : 0)
    }

    function updateDisplay() {
        items.forEach(item => {
            const k = item.dataset.question
            // Serial 7 rows count correct answers, not points, so their score is shown on the "All 5" row
            if (serialKeys.includes(k)) return
            item.querySelector('.bims-item-score').textContent = scores[k] !== undefined ? scores[k] : '—'
        })

        document.querySelector('#moca-serial7-all-row .bims-item-score').textContent =
            serialKeys.every(k => scores[k] !== undefined) ? points(serialKeys) : ''

        parts.forEach(part => {
            const subtotalEl = part.querySelector('.bims-subtotal strong')
            if (!subtotalEl) return
            const keys = [...part.querySelectorAll('.bims-item[data-question]')].map(i => i.dataset.question)
            subtotalEl.textContent = keys.every(k => scores[k] !== undefined) ? points(keys) : '—'
        })

        // Memory Index Score: no cue ×3, category cue ×2, multiple choice cue ×1
        const misScored = recallKeys.filter(k => mis[k] !== undefined)
            ;[3, 2, 1, 0].forEach(w => {
                const count = misScored.filter(k => mis[k] === w).length
                document.querySelector(`[data-mis-count="${w}"]`).textContent = count
                document.querySelector(`[data-mis-points="${w}"]`).textContent = count * w
            })
        const misDone = misScored.length === recallKeys.length
        document.getElementById('moca-mis').textContent = misDone ? sum(mis, recallKeys) : '—'
        document.getElementById('moca-mis-progress').textContent =
            misDone ? '' : `${misScored.length} of ${recallKeys.length} words scored`

        const allKeys = [...items].map(i => i.dataset.question)
        const totalEl = document.getElementById('moca-total')
        const interpEl = document.getElementById('moca-interpretation')
        interpEl.className = 'bims-interpretation'
        interpEl.textContent = ''

        if (!allKeys.every(k => scores[k] !== undefined)) {
            totalEl.textContent = '—'
            summaryEl.value = ''
            return
        }

        const raw = points(allKeys)
        const total = Math.min(30, raw + educationPoint)
        totalEl.textContent = total

        const label = total >= 26 ? 'Normal (26–30)' : 'Below normal (under 26)'
        const eduNote = educationPoint && raw < 30 ? ` · Includes +1 for ≤ 12 years education` : ''
        interpEl.textContent = label + eduNote
        interpEl.className = `bims-interpretation ${total >= 26 ? 'bims-intact' : 'bims-severe'}`

        summaryEl.value = scoreSummary({
            test: 'MoCA', score: `${total}/30`, normal: total >= 26,
            level: total >= 26 ? 'within normal limits' : 'below normal limits',
            areas: deficitDomains()
        })
    }

    const deficitDomains = () => summaryDomains.filter(([, keys]) => points(keys) < maxFor(keys)).map(([name]) => name)

    // Cognitive domains for the summary; a domain is a deficit when any of its points are lost
    const summaryDomains = [
        ['visuospatial/executive function', ['trail', 'cube', 'clockContour', 'clockNumbers', 'clockHands']],
        ['naming', ['lion', 'rhino', 'camel']],
        ['attention', ['digitsFwd', 'digitsBwd', 'vigilance', ...serialKeys]],
        ['language', ['sentence1', 'sentence2', 'fluency']],
        ['abstract reasoning', ['trainBicycle', 'rulerWatch']],
        ['delayed recall', recallKeys],
        ['orientation', ['date', 'month', 'year', 'day', 'place', 'city']]
    ]
    // Serial 7s are worth 3 points together; every other item is worth 1
    const maxFor = keys => keys.filter(k => !serialKeys.includes(k)).length +
        (keys.some(k => serialKeys.includes(k)) ? 3 : 0)
    const summaryEl = document.getElementById('moca-summary')
    initCopyButton(document.getElementById('moca-summary-copy'), summaryEl,
        document.getElementById('moca-summary-status'))

    function select(item, btn) {
        const k = item.dataset.question
        item.querySelectorAll('.bims-btn').forEach(b => b.classList.remove('selected'))
        if (btn) {
            btn.classList.add('selected')
            scores[k] = parseInt(btn.dataset.value, 10)
            if (btn.dataset.mis !== undefined) mis[k] = parseInt(btn.dataset.mis, 10)
        } else {
            delete scores[k]
            delete mis[k]
        }
    }

    // "All" shortcut rows set every item in their group at once
    const shortcuts = [
        { row: document.getElementById('moca-clock-all-row'), keys: ['clockContour', 'clockNumbers', 'clockHands'] },
        { row: document.getElementById('moca-naming-all-row'), keys: ['lion', 'rhino', 'camel'] },
        { row: document.getElementById('moca-serial7-all-row'), keys: serialKeys },
        { row: document.getElementById('moca-recall-all-row'), keys: recallKeys },
        { row: document.getElementById('moca-orientation-all-row'), keys: ['date', 'month', 'year', 'day', 'place', 'city'] }
    ]

    const itemFor = k => document.querySelector(`[data-question="${k}"]`)
    const selectedId = k => {
        const btn = itemFor(k).querySelector('.bims-btn.selected')
        return btn ? choiceId(btn) : undefined
    }

    function syncShortcut({ row, keys }) {
        row.querySelectorAll('.bims-btn').forEach(b => b.classList.remove('selected'))
        const ids = keys.map(selectedId)
        if (ids[0] === undefined || !ids.every(id => id === ids[0])) return
        const match = [...row.querySelectorAll('.bims-btn')].find(b => choiceId(b) === ids[0])
        if (match) match.classList.add('selected')
    }

    items.forEach(item => {
        item.querySelectorAll('.bims-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                select(item, btn.classList.contains('selected') ? null : btn)
                shortcuts.forEach(s => { if (s.keys.includes(item.dataset.question)) syncShortcut(s) })
                updateDisplay()
            })
        })
    })

    shortcuts.forEach(shortcut => {
        shortcut.row.querySelectorAll('.bims-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const alreadySelected = btn.classList.contains('selected')
                shortcut.keys.forEach(k => {
                    const item = itemFor(k)
                    const target = [...item.querySelectorAll('.bims-btn')].find(b => choiceId(b) === choiceId(btn))
                    select(item, alreadySelected ? null : target)
                })
                syncShortcut(shortcut)
                updateDisplay()
            })
        })
    })

    function setEducation(value) {
        educationPoint = value
        educationRow.querySelectorAll('.bims-btn').forEach(b => {
            b.classList.toggle('selected', parseInt(b.dataset.value, 10) === value)
        })
    }

    educationRow.querySelectorAll('.bims-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setEducation(parseInt(btn.dataset.value, 10))
            updateDisplay()
        })
    })

    // Letter F fluency tap counter: auto-selects 11+ words (1) or under 11 (0)
    const fluencyItem = itemFor('fluency')
    const fluencyTally = initTally(document.getElementById('moca-fluency-tally'), count => {
        select(fluencyItem, count === 0 ? null : fluencyItem.querySelector(`.bims-btn[data-value="${count >= 11 ? 1 : 0}"]`))
        updateDisplay()
    })

    // Letter F fluency 1-minute countdown timer
    const resetFluencyTimer = initCountdown(document.getElementById('moca-fluency-timer'), 60)

    // Orientation reference: today's date, time and (on request) the administrator's city
    initTodayCard(document.getElementById('moca-today'))

    // PDF report. The five serial 7s are one scored item (4–5 correct = 3, 2–3 = 2, 1 = 1).
    const reportSections = [
        ['Visuospatial / executive', [['1', 'Alternating trail', 'trail'], ['2', 'Copy cube', 'cube'],
        ['3', 'Clock: contour', 'clockContour'], ['3', 'Clock: numbers', 'clockNumbers'], ['3', 'Clock: hands', 'clockHands']]],
        ['Naming', [['4', 'Lion', 'lion'], ['4', 'Rhinoceros', 'rhino'], ['4', 'Camel', 'camel']]],
        ['Attention', [['6a', 'Digits forward (21854)', 'digitsFwd'], ['6b', 'Digits backward (247)', 'digitsBwd'],
        ['7', 'Letter tapping', 'vigilance'], ['8', 'Serial 7s (93, 86, 79, 72, 65)', 'serial7']]],
        ['Language', [['9a', 'Sentence repetition 1', 'sentence1'], ['9b', 'Sentence repetition 2', 'sentence2'],
        ['10', 'Letter F fluency', 'fluency']]],
        ['Abstraction', [['11a', 'Train – bicycle', 'trainBicycle'], ['11b', 'Ruler – watch', 'rulerWatch']]],
        ['Delayed recall (no cue)', [['12', 'Face', 'face'], ['12', 'Velvet', 'velvet'], ['12', 'Church', 'church'],
        ['12', 'Daisy', 'daisy'], ['12', 'Red', 'red']]],
        ['Orientation', [['13', 'Date', 'date'], ['13', 'Month', 'month'], ['13', 'Year', 'year'], ['13', 'Day', 'day'],
        ['13', 'Place', 'place'], ['13', 'City', 'city']]]
    ]

    const report = initReportForm('moca', ({ patient, admin, when }) => {
        const serialDone = serialKeys.every(k => scores[k] !== undefined)
        const serialCorrect = sum(scores, serialKeys.filter(k => scores[k] !== undefined))
        const fluencyCount = parseInt(document.querySelector('#moca-fluency-tally .tally-count').textContent, 10)

        const row = ([num, item, key]) => {
            if (key === 'serial7') {
                return {
                    num, item, max: 3,
                    points: serialDone ? serialPoints(serialCorrect) : undefined,
                    response: serialDone ? `${serialCorrect} of 5 correct` : null
                }
            }
            const label = selectedLabel(key)
            return {
                num, item, max: 1, points: scores[key],
                response: key === 'fluency' && label && fluencyCount > 0 ? `${fluencyCount} words (${label})` : label
            }
        }
        const sections = reportSections.map(([title, rows]) => ({ title, rows: rows.map(row) }))

        const allKeys = [...items].map(i => i.dataset.question)
        const done = allKeys.every(k => scores[k] !== undefined)
        const raw = points(allKeys.filter(k => !serialKeys.includes(k) && scores[k] !== undefined)) +
            (serialDone ? serialPoints(serialCorrect) : 0)
        const total = Math.min(30, raw + educationPoint)
        const misDone = recallKeys.every(k => mis[k] !== undefined)

        return {
            title: 'MoCA Report',
            subtitle: 'Montreal Cognitive Assessment',
            filename: 'MoCA',
            patient, admin, when,
            details: [
                ['Education', educationPoint ? '12 years or fewer (+1 point)' : 'More than 12 years'],
                ['Memory Index Score', misDone ? `${sum(mis, recallKeys)} / 15` : '—']
            ],
            dense: true,
            total, max: 30,
            interpretation: !done
                ? `Incomplete: ${allKeys.filter(k => scores[k] !== undefined).length} of ${allKeys.length} items scored`
                : total >= 26 ? 'Normal' : 'Below normal',
            areasNote: done ? areasNote(total >= 26, deficitDomains()) : '',
            sections,
            cutoffs: {
                head: ['Score', 'Interpretation'],
                rows: [['26–30', 'Normal'], ['0–25', 'Below normal']]
            }
        }
    })

    document.getElementById('moca-reset-btn').addEventListener('click', () => {
        report.reset()
        fluencyTally.reset()
        resetFluencyTimer()
        items.forEach(item => select(item, null))
        shortcuts.forEach(syncShortcut)
        setEducation(0)
        updateDisplay()
    })

    setEducation(0)
    updateDisplay()
}

function initSLUMS() {
    const items = document.querySelectorAll('.bims-item[data-question]')
    const parts = document.querySelectorAll('.bims-part')
    const educationRow = document.getElementById('slums-education')
    const scores = {}
    let education = null

    // Cutoffs from the SLUMS form: [normal min, MNCD min]
    const cutoffs = {
        hs: { normal: 27, mncd: 21, label: 'High school education or higher' },
        lths: { normal: 25, mncd: 20, label: 'Less than high school education' }
    }

    function sum(keys) {
        return keys.reduce((total, k) => total + scores[k], 0)
    }

    // Cognitive domains for the summary; a domain is a deficit when any of its points are lost
    const domains = [
        ['orientation', ['day', 'year', 'state']],
        ['problem solving', ['spent', 'left']],
        ['verbal fluency', ['animals']],
        ['sequencing', ['digits648', 'digits8537']],
        ['visual reasoning', ['clockMarkers', 'clockTime', 'triangle', 'largest']],
        ['short-term recall', ['apple', 'pen', 'tie', 'house', 'car', 'storyName', 'storyWork', 'storyWhen', 'storyState']]
    ]
    const summaryEl = document.getElementById('slums-summary')

    function updateSummary() {
        const allKeys = [...items].map(i => i.dataset.question)
        if (!allKeys.every(k => scores[k] !== undefined) || !education) {
            summaryEl.value = ''
            return
        }
        const total = sum(allKeys)
        const c = cutoffs[education]
        const level = total >= c.normal ? 'within normal limits'
            : total >= c.mncd ? 'consistent with mild neurocognitive disorder' : 'consistent with dementia'
        summaryEl.value = scoreSummary({
            test: 'SLUMS examination', score: `${total}/30`, level, normal: total >= c.normal,
            areas: deficitDomains()
        })
    }

    const deficitDomains = () => domains.filter(([, keys]) => keys.some(k => scores[k] < maxPoints(k))).map(([name]) => name)

    function updateDisplay() {
        updateSummary()
        items.forEach(item => {
            const k = item.dataset.question
            item.querySelector('.bims-item-score').textContent = scores[k] !== undefined ? scores[k] : '—'
        })

        // Subtotal for each part that has scored items
        parts.forEach(part => {
            const subtotalEl = part.querySelector('.bims-subtotal strong')
            if (!subtotalEl) return
            const keys = [...part.querySelectorAll('.bims-item[data-question]')].map(i => i.dataset.question)
            subtotalEl.textContent = keys.every(k => scores[k] !== undefined) ? sum(keys) : '—'
        })

        const allKeys = [...items].map(i => i.dataset.question)
        const totalEl = document.getElementById('slums-total')
        const interpEl = document.getElementById('slums-interpretation')
        interpEl.className = 'bims-interpretation'
        interpEl.textContent = ''

        if (!allKeys.every(k => scores[k] !== undefined)) {
            totalEl.textContent = '—'
            return
        }

        const total = sum(allKeys)
        totalEl.textContent = total

        if (!education) {
            interpEl.textContent = 'Select education level to interpret score'
            return
        }

        const c = cutoffs[education]
        let label, cls
        if (total >= c.normal) { label = `Normal (${c.normal}–30)`; cls = 'bims-intact' }
        else if (total >= c.mncd) { label = `Mild Neurocognitive Disorder (${c.mncd}–${c.normal - 1})`; cls = 'bims-moderate' }
        else { label = `Dementia (1–${c.mncd - 1})`; cls = 'bims-severe' }
        interpEl.textContent = `${label} · ${c.label}`
        interpEl.className = `bims-interpretation ${cls}`
    }

    items.forEach(item => {
        const question = item.dataset.question
        item.querySelectorAll('.bims-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const alreadySelected = btn.classList.contains('selected')
                item.querySelectorAll('.bims-btn').forEach(b => b.classList.remove('selected'))
                if (alreadySelected) {
                    delete scores[question]
                } else {
                    btn.classList.add('selected')
                    scores[question] = parseInt(btn.dataset.value, 10)
                }
                shortcuts.forEach(s => { if (s.keys.includes(question)) syncShortcut(s) })
                updateDisplay()
            })
        })
    })

    // "All" shortcut rows set every item in their group at once
    const shortcuts = [
        { row: document.getElementById('slums-orientation-all-row'), keys: ['day', 'year', 'state'] },
        { row: document.getElementById('slums-recall-all-row'), keys: ['apple', 'pen', 'tie', 'house', 'car'] },
        { row: document.getElementById('slums-story-all-row'), keys: ['storyName', 'storyWork', 'storyWhen', 'storyState'] }
    ]

    function syncShortcut({ row, keys }) {
        row.querySelectorAll('.bims-btn').forEach(b => b.classList.remove('selected'))
        const vals = keys.map(k => scores[k])
        if (vals.every(v => v !== undefined) && vals.every(v => v === vals[0])) {
            row.querySelector(`.bims-btn[data-value="${vals[0]}"]`).classList.add('selected')
        }
    }

    shortcuts.forEach(shortcut => {
        shortcut.row.querySelectorAll('.bims-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const alreadySelected = btn.classList.contains('selected')
                const val = parseInt(btn.dataset.value, 10)
                shortcut.keys.forEach(k => {
                    const item = document.querySelector(`[data-question="${k}"]`)
                    item.querySelectorAll('.bims-btn').forEach(b => b.classList.remove('selected'))
                    if (alreadySelected) {
                        delete scores[k]
                    } else {
                        scores[k] = val
                        item.querySelector(`.bims-btn[data-value="${val}"]`).classList.add('selected')
                    }
                })
                syncShortcut(shortcut)
                updateDisplay()
            })
        })
    })

    // Animal naming tap counter: each tap = one animal, auto-selects the score range
    const animalItem = document.querySelector('[data-question="animals"]')
    const animalTally = initTally(document.getElementById('slums-animal-tally'), count => {
        animalItem.querySelectorAll('.bims-btn').forEach(b => b.classList.remove('selected'))
        if (count === 0) {
            delete scores.animals
        } else {
            scores.animals = Math.min(3, Math.floor(count / 5))
            animalItem.querySelector(`.bims-btn[data-value="${scores.animals}"]`).classList.add('selected')
        }
        updateDisplay()
    })

    // Orientation reference: today's day and year, and (on request) the administrator's state
    initTodayCard(document.getElementById('slums-today'))

    // Animal naming 1-minute countdown timer
    const resetTimer = initCountdown(document.getElementById('slums-animal-timer'), 60)

    initCopyButton(document.getElementById('slums-summary-copy'), summaryEl,
        document.getElementById('slums-summary-status'))

    function setEducation(value) {
        education = value
        educationRow.querySelectorAll('.bims-btn').forEach(b => {
            b.classList.toggle('selected', b.dataset.value === value)
        })
    }

    educationRow.querySelectorAll('.bims-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setEducation(btn.dataset.value)
            updateDisplay()
        })
    })

    // PDF report: every scored item, grouped by section, in test order
    const reportSections = [
        ['Orientation', [['1', 'Day of the week', 'day', 1], ['2', 'Year', 'year', 1], ['3', 'State', 'state', 1]]],
        ['Calculation', [['5a', 'Amount spent ($23)', 'spent', 1], ['5b', 'Amount left ($77)', 'left', 2]]],
        ['Animal naming', [['6', 'Animals named in one minute', 'animals', 3]]],
        ['Object recall', [['7', 'Apple', 'apple', 1], ['7', 'Pen', 'pen', 1], ['7', 'Tie', 'tie', 1],
        ['7', 'House', 'house', 1], ['7', 'Car', 'car', 1]]],
        ['Digits backward', [['8b', '649 (946)', 'digits648', 1], ['8c', '8537 (7358)', 'digits8537', 1]]],
        ['Clock drawing', [['9', 'Hour markers', 'clockMarkers', 2], ['9', 'Time: ten minutes to eleven', 'clockTime', 2]]],
        ['Figures', [['10a', 'X in the triangle', 'triangle', 1], ['10b', 'Largest figure', 'largest', 1]]],
        ['Story recall', [['11a', 'Woman\'s name (Jill)', 'storyName', 2], ['11b', 'Work (stockbroker)', 'storyWork', 2],
        ['11c', 'When she went back to work (teenagers)', 'storyWhen', 2], ['11d', 'State (Illinois)', 'storyState', 2]]]
    ]

    const report = initReportForm('slums', ({ patient, admin, when }) => {
        const responseFor = key => {
            const label = selectedLabel(key)
            if (!label) return null
            const count = parseInt(document.querySelector('#slums-animal-tally .tally-count').textContent, 10)
            return key === 'animals' && count > 0 ? `${count} animals (${label})` : label
        }

        const sections = reportSections.map(([title, rows]) => ({
            title,
            rows: rows.map(([num, item, key, max]) => ({ num, item, max, points: scores[key], response: responseFor(key) }))
        }))

        const allKeys = [...items].map(i => i.dataset.question)
        const scored = allKeys.filter(k => scores[k] !== undefined).length
        const total = sum(allKeys.filter(k => scores[k] !== undefined))
        const c = cutoffs[education]
        let interpretation = `Incomplete: ${scored} of ${allKeys.length} items scored`
        let note = ''
        if (scored === allKeys.length) {
            interpretation = total >= c.normal ? 'Normal'
                : total >= c.mncd ? 'Mild Neurocognitive Disorder' : 'Dementia'
            note = areasNote(total >= c.normal, deficitDomains())
        }

        return {
            title: 'SLUMS Report',
            subtitle: 'Saint Louis University Mental Status Examination',
            filename: 'SLUMS',
            patient, admin, when,
            details: [['Education', c.label]],
            total, max: 30, interpretation, sections, areasNote: note,
            cutoffs: {
                head: ['', 'High school or higher', 'Less than high school'],
                rows: [['Normal', '27–30', '25–30'], ['Mild neurocognitive disorder', '21–26', '20–24'],
                ['Dementia', '1–20', '1–19']]
            }
        }
    })

    document.getElementById('slums-reset-btn').addEventListener('click', () => {
        Object.keys(scores).forEach(k => delete scores[k])
        document.querySelectorAll('.bims-btn').forEach(b => b.classList.remove('selected'))
        animalTally.reset()
        resetTimer()
        report.reset()
        setEducation('hs')
        updateDisplay()
    })

    setEducation('hs')
    updateDisplay()
}

function initBIMS() {
    const questions = {
        c0200a: 1, c0200b: 1, c0200c: 1,
        c0300a: 3, c0300b: 2, c0300c: 1,
        c0400a: 2, c0400b: 2, c0400c: 2
    }
    const scores = {}

    function getSubtotal(keys) {
        return keys.reduce((sum, k) => sum + (scores[k] ?? null), 0)
    }

    function allAnswered(keys) {
        return keys.every(k => scores[k] !== undefined)
    }

    // Areas where any points were lost, for the summary and the PDF report
    function deficitAreas() {
        const areas = [['word repetition', ['c0200a', 'c0200b', 'c0200c']],
        ['temporal orientation', ['c0300a', 'c0300b', 'c0300c']], ['short-term recall', ['c0400a', 'c0400b', 'c0400c']]]
        return areas.filter(([, keys]) => keys.some(k => scores[k] < questions[k])).map(([name]) => name)
    }

    function updateDisplay() {
        const repKeys = ['c0200a', 'c0200b', 'c0200c']
        const oriKeys = ['c0300a', 'c0300b', 'c0300c']
        const recKeys = ['c0400a', 'c0400b', 'c0400c']
        const allKeys = [...repKeys, ...oriKeys, ...recKeys]

        // Update per-item score display
        allKeys.forEach(k => {
            const item = document.querySelector(`[data-question="${k}"]`)
            if (!item) return
            const scoreEl = item.querySelector('.bims-item-score')
            if (scoreEl) scoreEl.textContent = scores[k] !== undefined ? scores[k] : '—'
        })

        // Subtotals
        const repDone = allAnswered(repKeys)
        const oriDone = allAnswered(oriKeys)
        const recDone = allAnswered(recKeys)

        document.getElementById('c0200-subtotal').textContent = repDone ? getSubtotal(repKeys) : '—'
        document.getElementById('c0300-subtotal').textContent = oriDone ? getSubtotal(oriKeys) : '—'
        document.getElementById('c0400-subtotal').textContent = recDone ? getSubtotal(recKeys) : '—'

        // Total
        const totalEl = document.getElementById('bims-total')
        const interpEl = document.getElementById('bims-interpretation')
        if (allAnswered(allKeys)) {
            const total = getSubtotal(allKeys)
            totalEl.textContent = total
            let label, cls
            if (total >= 13) { label = 'Cognitively Intact (13–15)'; cls = 'bims-intact' }
            else if (total >= 8) { label = 'Moderately Impaired (8–12)'; cls = 'bims-moderate' }
            else { label = 'Severely Impaired (0–7)'; cls = 'bims-severe' }
            interpEl.textContent = label
            interpEl.className = `bims-interpretation ${cls}`

            summaryEl.value = scoreSummary({
                test: 'BIMS', score: `${total}/15`, normal: total >= 13,
                level: total >= 13 ? 'indicating intact cognition'
                    : total >= 8 ? 'consistent with moderate cognitive impairment'
                        : 'consistent with severe cognitive impairment',
                areas: deficitAreas()
            })
        } else {
            totalEl.textContent = '—'
            interpEl.textContent = ''
            interpEl.className = 'bims-interpretation'
            summaryEl.value = ''
        }
    }

    const summaryEl = document.getElementById('bims-summary')
    initCopyButton(document.getElementById('bims-summary-copy'), summaryEl,
        document.getElementById('bims-summary-status'))

    const repWordKeys = ['c0200a', 'c0200b', 'c0200c']
    const recWordKeys = ['c0400a', 'c0400b', 'c0400c']

    function syncAllThreeShortcut(rowId, wordKeys) {
        const allRow = document.getElementById(rowId)
        if (!allRow) return
        allRow.querySelectorAll('.bims-btn').forEach(b => b.classList.remove('selected'))
        const vals = wordKeys.map(k => scores[k])
        if (vals.every(v => v !== undefined) && vals.every(v => v === vals[0])) {
            allRow.querySelector(`.bims-btn[data-value="${vals[0]}"]`).classList.add('selected')
        }
    }

    function wireAllThreeRow(rowId, wordKeys) {
        const allRow = document.getElementById(rowId)
        if (!allRow) return
        allRow.querySelectorAll('.bims-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const alreadySelected = btn.classList.contains('selected')
                allRow.querySelectorAll('.bims-btn').forEach(b => b.classList.remove('selected'))
                const wordVal = parseInt(btn.dataset.value, 10)
                wordKeys.forEach(k => {
                    const item = document.querySelector(`[data-question="${k}"]`)
                    item.querySelectorAll('.bims-btn').forEach(b => b.classList.remove('selected'))
                    if (alreadySelected) {
                        delete scores[k]
                    } else {
                        scores[k] = wordVal
                        item.querySelector(`.bims-btn[data-value="${wordVal}"]`).classList.add('selected')
                    }
                })
                if (!alreadySelected) btn.classList.add('selected')
                updateDisplay()
            })
        })
    }

    // Wire up all scored buttons
    document.querySelectorAll('.bims-item[data-question]').forEach(item => {
        const question = item.dataset.question
        item.querySelectorAll('.bims-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const alreadySelected = btn.classList.contains('selected')
                item.querySelectorAll('.bims-btn').forEach(b => b.classList.remove('selected'))
                if (alreadySelected) {
                    delete scores[question]
                } else {
                    btn.classList.add('selected')
                    scores[question] = parseInt(btn.dataset.value, 10)
                }
                if (repWordKeys.includes(question)) syncAllThreeShortcut('c0200-all-row', repWordKeys)
                if (recWordKeys.includes(question)) syncAllThreeShortcut('c0400-all-row', recWordKeys)
                updateDisplay()
            })
        })
    })

    wireAllThreeRow('c0200-all-row', repWordKeys)
    wireAllThreeRow('c0400-all-row', recWordKeys)

    // Orientation reference: today's year, month and day of the week
    initTodayCard(document.getElementById('bims-today'))

    // PDF report
    const reportSections = [
        ['Repetition of three words · C0200', [['1', 'Sock', 'c0200a'], ['1', 'Blue', 'c0200b'], ['1', 'Bed', 'c0200c']]],
        ['Temporal orientation · C0300', [['2', 'Year', 'c0300a'], ['3', 'Month', 'c0300b'], ['4', 'Day of the week', 'c0300c']]],
        ['Word recall · C0400', [['5', 'Sock', 'c0400a'], ['5', 'Blue', 'c0400b'], ['5', 'Bed', 'c0400c']]]
    ]

    const report = initReportForm('bims', ({ patient, admin, when }) => {
        const sections = reportSections.map(([title, rows]) => ({
            title,
            rows: rows.map(([num, item, key]) => ({ num, item, max: questions[key], points: scores[key], response: selectedLabel(key) }))
        }))
        const allKeys = Object.keys(questions)
        const total = getSubtotal(allKeys.filter(k => scores[k] !== undefined))
        const interpretation = !allAnswered(allKeys)
            ? `Incomplete: ${allKeys.filter(k => scores[k] !== undefined).length} of ${allKeys.length} items scored`
            : total >= 13 ? 'Cognitively Intact' : total >= 8 ? 'Moderately Impaired' : 'Severely Impaired'

        return {
            title: 'BIMS Report',
            subtitle: 'Brief Interview for Mental Status',
            filename: 'BIMS',
            patient, admin, when,
            total, max: 15, interpretation, sections,
            areasNote: allAnswered(allKeys) ? areasNote(total >= 13, deficitAreas()) : '',
            cutoffs: {
                head: ['Score', 'Interpretation'],
                rows: [['13–15', 'Cognitively intact'], ['8–12', 'Moderately impaired'], ['0–7', 'Severely impaired']]
            }
        }
    })

    // Reset button
    const resetBtn = document.getElementById('bims-reset-btn')
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            Object.keys(scores).forEach(k => delete scores[k])
            document.querySelectorAll('.bims-btn').forEach(b => b.classList.remove('selected'))
            report.reset()
            updateDisplay()
        })
    }

    updateDisplay()
}

function initBCRS() {
    const stages = {
        1: {
            title: 'Stage 1: No Cognitive Decline (Normal)',
            desc: 'No subjective complaints of memory deficit. No memory deficit evident on clinical interview; normal adult.'
        },
        2: {
            title: 'Stage 2: Very Mild Cognitive Decline (Age Associated Memory Impairment)',
            desc: 'Subjective complaints of memory deficit, most frequently in the following areas: forgetting where one has placed familiar objects, forgetting names one formerly knew well. Subjective deficit in word finding. No objective evidence of memory deficit on clinical interview. No objective deficits in employment or social situations. Appropriate concern with respect to symptomatology.'
        },
        3: {
            title: 'Stage 3: Mild Cognitive Decline (Mild Cognitive Impairment)',
            desc: 'Earliest clear-cut deficits on careful interview. Manifestations in more than one of the following areas: patient may have gotten lost when traveling to an unfamiliar location, word and name finding deficit become evident to others, patient may read a passage or a book and retain relatively little material, patient may demonstrate decreased ability in remembering names upon introduction, patient may have lost or misplaced an object of value. Objective evidence of memory deficit obtained only with an intensive interview. Denial begins to become apparent in patient. Mild to moderate anxiety accompanies symptoms.'
        },
        4: {
            title: 'Stage 4: Moderate Cognitive Decline (Mild Dementia)',
            desc: 'Clear-cut deficits on careful clinical interview. Deficits are apparent in the following areas: decreased knowledge of current and recent events, may exhibit some deficit in memory of one’s personal history, concentration deficit elicited on serial subtractions, decreased ability to travel, handle finances, etc. Frequently no deficit in the following areas: orientation to time and place, recognition of familiar persons and faces, ability to travel to familiar locations. Assistance required to perform complex tasks (handling finances, planning dinner for guests). Denial is a dominant defense mechanism. Flattening of affect and withdrawal from challenging situations frequently occur.'
        },
        5: {
            title: 'Stage 5: Moderately Severe Cognitive Decline (Moderate Dementia)',
            desc: 'Patient can no longer survive without some assistance. Patient is unable during interview to recall a major relevant aspect of their current lives (an address or telephone number of many years, the names of close family members, the name of the high school or college from which they graduated). Frequently some disorientation to time (date, day of week, season) or to place. Require no assistance with toileting or eating, but may have difficulty with choosing the proper clothing to wear.'
        },
        6: {
            title: 'Stage 6: Severe Cognitive Decline (Moderately Severe Dementia)',
            desc: 'Patient will be largely unaware of all recent experiences and events in their lives. Retain some knowledge of their past lives but this is very sketchy. Generally unaware of their surroundings, the year, season, etc. Personality and emotional changes occur. Assistance required in putting on clothing, bathing properly, toileting mechanics. May become incontinent of bowel and bladder. Almost always recall their own name. Frequently continue to be able to distinguish familiar from unfamiliar persons in their environment.'
        },
        7: {
            title: 'Stage 7: Very Severe Cognitive Decline (Severe Dementia or Late Dementia)',
            desc: 'All verbal abilities are lost over the course of this stage. Frequently there is no speech at all, only unintelligible utterances and rare emergence of forgotten words and phrases. Speech ability limited to approx. a half-dozen intelligible words. Incontinent of urine, requires assistance with toileting and feeding. Basic psychomotor skills (ability to walk, sit up) are lost with the progression of this stage. Ability to smile lost. The brain appears to no longer be able to tell the body what to do. Generalized rigidity and developmental neurologic reflexes are frequently present.'
        }
    }
    const groups = document.querySelectorAll('.bcrs-rating[data-axis]')
    const scores = {}

    function updateDisplay() {
        const totalEl = document.getElementById('bcrs-total')
        const gdsEl = document.getElementById('bcrs-gds')
        const stageEl = document.getElementById('bcrs-stage')
        const values = Object.values(scores)

        totalEl.textContent = values.length ? values.reduce((a, b) => a + b, 0) : '—'

        if (values.length === groups.length) {
            const gds = values.reduce((a, b) => a + b, 0) / groups.length
            const stage = stages[Math.round(gds)]
            gdsEl.textContent = Number.isInteger(gds) ? gds : gds.toFixed(1)
            document.getElementById('bcrs-stage-title').textContent = stage.title
            document.getElementById('bcrs-stage-desc').textContent = stage.desc
            stageEl.hidden = false

            // "Stage 4: Moderate Cognitive Decline (Mild Dementia)" → "GDS stage 4, moderate cognitive decline"
            const [stageNum, stageName] = stage.title.split(': ')
            const total = values.reduce((a, b) => a + b, 0)
            summaryEl.value = scoreSummary({
                test: 'BCRS', score: `${total}/35`,
                level: `consistent with GDS ${stageNum.toLowerCase()}, ${stageName.replace(/\s*\(.*\)/, '').toLowerCase()}`,
                normal: Math.round(gds) === 1, minor: 'though mild changes were noted in',
                areas: deficitAreas()
            })
        } else {
            gdsEl.textContent = '—'
            stageEl.hidden = true
            summaryEl.value = ''
        }
    }

    // A rating of 1 means no deficit in that area
    const deficitAreas = () => [...groups].filter(g => scores[g.dataset.axis] > 1).map(g => areaNames[g.dataset.axis].toLowerCase())

    const summaryEl = document.getElementById('bcrs-summary')
    initCopyButton(document.getElementById('bcrs-summary-copy'), summaryEl,
        document.getElementById('bcrs-summary-status'))

    groups.forEach(group => {
        const axis = group.dataset.axis
        group.querySelectorAll('.bcrs-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const alreadySelected = btn.classList.contains('selected')
                group.querySelectorAll('.bcrs-option').forEach(b => b.classList.remove('selected'))
                if (alreadySelected) {
                    delete scores[axis]
                } else {
                    btn.classList.add('selected')
                    scores[axis] = parseInt(btn.dataset.value, 10)
                }
                updateDisplay()
            })
        })
    })

    // Orientation reference: today's date and time, and (on request) the administrator's city
    initTodayCard(document.getElementById('bcrs-today'))

    // PDF report: one row per rated area; higher ratings mean more impairment, so no ✓/✗ marks
    const areaNames = {
        past: 'Past memory', recent: 'Recent memory', orientation: 'Orientation',
        concentration: 'Concentration', function: 'Functioning and self care'
    }

    const report = initReportForm('bcrs', ({ patient, admin, when }) => {
        const rows = [...groups].map((group, i) => {
            const axis = group.dataset.axis
            const btn = group.querySelector('.bcrs-option.selected')
            return {
                num: String(i + 1),
                item: areaNames[axis],
                max: 7,
                points: scores[axis],
                response: btn ? btn.querySelector('span:last-child').textContent.replace(/\s+/g, ' ').trim() : null
            }
        })
        const values = Object.values(scores)
        const total = values.reduce((a, b) => a + b, 0)
        const done = values.length === groups.length
        const gds = total / groups.length
        const stage = done ? stages[Math.round(gds)] : null

        return {
            title: 'BCRS Report',
            subtitle: 'Brief Cognitive Rating Scale',
            filename: 'BCRS',
            patientLabel: 'Resident',
            patient, admin, when,
            details: [['GDS score', done ? (Number.isInteger(gds) ? gds : gds.toFixed(1)) : '—']],
            marks: false,
            total, max: 35,
            interpretation: stage ? stage.title : `Incomplete: ${values.length} of ${groups.length} areas rated`,
            areasNote: done ? areasNote(Math.round(gds) === 1, deficitAreas()) : '',
            sections: [{ title: 'Ratings (1 = no deficit, 7 = most severe)', rows }],
            cutoffs: {
                head: ['GDS stage', 'Total', 'Interpretation'],
                rows: [['1', '5–7', 'No cognitive decline'], ['2', '8–12', 'Very mild cognitive decline'],
                ['3', '13–17', 'Mild cognitive decline'], ['4', '18–22', 'Moderate cognitive decline'],
                ['5', '23–27', 'Moderately severe cognitive decline'], ['6', '28–32', 'Severe cognitive decline'],
                ['7', '33–35', 'Very severe cognitive decline']]
            }
        }
    })

    const resetBtn = document.getElementById('bcrs-reset-btn')
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            Object.keys(scores).forEach(k => delete scores[k])
            document.querySelectorAll('.bcrs-option').forEach(b => b.classList.remove('selected'))
            report.reset()
            updateDisplay()
        })
    }

    updateDisplay()
}

// Local storage functions for PCC order generator
function savePCCSelections() {
    const data = {
        checkboxes: {},
        output: document.getElementById('pccOutput')?.value || ''
    }

    // Save all checkbox states from categories
    document.querySelectorAll('.categories input[type="checkbox"]').forEach(cb => {
        const id = cb.id || cb.dataset.label || cb.parentElement.textContent.trim()
        data.checkboxes[id] = cb.checked
    })

    localStorage.setItem('slp-pcc-selections', JSON.stringify(data))
}

function loadPCCSelections() {
    try {
        const saved = localStorage.getItem('slp-pcc-selections')
        if (saved) {
            return JSON.parse(saved)
        }
    } catch (e) {
        console.error('Error loading PCC selections:', e)
    }
    return { checkboxes: {}, output: '' }
}

function clearPCCSelections() {
    localStorage.removeItem('slp-pcc-selections')
}

// Local storage functions for productivity data
function saveProductivityData() {
    const data = {
        rows: [],
        workHours: parseInt(document.getElementById('work-hours')?.value) || 8,
        workMinutes: parseInt(document.getElementById('work-minutes')?.value) || 0,
        clockInTime: document.getElementById('clock-in-input')?.value || '10:00',
        lunchBreak: parseInt(document.getElementById('lunch-break-input')?.value) || 30
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
    return { rows: [], workHours: 8, workMinutes: 0, clockInTime: '10:00', lunchBreak: 30 }
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
        patientInput.placeholder = 'Patient'
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
    }

    // Add cell to selection
    function addCellToSelection(input) {
        const cellId = `${input.dataset.row}-${input.dataset.col}`
        selectedCells.add(cellId)
        input.classList.add('selected')
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

    // Load saved clock-in time and lunch break
    const clockInInput = document.getElementById('clock-in-input')
    const lunchBreakInput = document.getElementById('lunch-break-input')

    if (clockInInput && savedData.clockInTime !== undefined) {
        clockInInput.value = savedData.clockInTime
    }
    if (lunchBreakInput && savedData.lunchBreak !== undefined) {
        lunchBreakInput.value = savedData.lunchBreak
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


    // Clear clock button
    const clearClockBtn = document.getElementById('clear-clock-btn')
    if (clearClockBtn) {
        clearClockBtn.addEventListener('click', clearClockInputs)
    }

    // Initial calculation
    calculateProductivity()

    // Initialize time clock
    initTimeClock()
}

// Clear clock inputs to default values
function clearClockInputs() {
    const clockInInput = document.getElementById('clock-in-input')
    const clockWorkHoursInput = document.getElementById('clock-work-hours')
    const clockWorkMinutesInput = document.getElementById('clock-work-minutes')
    const lunchBreakInput = document.getElementById('lunch-break-input')
    const workHoursInput = document.getElementById('work-hours')
    const workMinutesInput = document.getElementById('work-minutes')

    // Reset to default values
    if (clockInInput) clockInInput.value = '10:00'
    if (clockWorkHoursInput) clockWorkHoursInput.value = '8'
    if (clockWorkMinutesInput) clockWorkMinutesInput.value = '0'
    if (lunchBreakInput) lunchBreakInput.value = '30'

    // Sync with productivity calculator inputs
    if (workHoursInput) workHoursInput.value = '8'
    if (workMinutesInput) workMinutesInput.value = '0'

    // Recalculate and save
    calculateClockOut()
    calculateProductivity()
    saveProductivityData()
}

// Time Clock functionality
function initTimeClock() {
    // Update current time and date
    updateCurrentTime()
    setInterval(updateCurrentTime, 1000)

    // Add event listeners for clock calculations
    const clockInInput = document.getElementById('clock-in-input')
    const lunchBreakInput = document.getElementById('lunch-break-input')

    if (clockInInput) {
        clockInInput.addEventListener('input', () => {
            calculateClockOut()
            saveProductivityData()
        })
    }

    const ampmToggle = document.getElementById('ampm-toggle')
    if (ampmToggle) {
        ampmToggle.addEventListener('click', () => {
            ampmToggle.textContent = ampmToggle.textContent === 'AM' ? 'PM' : 'AM'
            calculateClockOut()
            saveProductivityData()
        })
    }
    if (lunchBreakInput) {
        lunchBreakInput.addEventListener('input', () => {
            calculateClockOut()
            saveProductivityData()
        })
    }

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

    // Parse clock-in time with AM/PM
    let [hours, minutes] = clockInValue.split(':').map(Number)
    const ampm = document.getElementById('ampm-toggle')?.textContent || 'AM'
    if (ampm === 'PM' && hours !== 12) hours += 12
    if (ampm === 'AM' && hours === 12) hours = 0
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

// Tap counter: +1 / −1 / Clear buttons around a count. Calls onChange(count) after
// each tap; returns { reset } which zeroes the count without calling onChange.
function initTally(tally, onChange) {
    const countEl = tally.querySelector('.tally-count')
    let count = 0

    function set(n) {
        count = Math.max(0, n)
        countEl.textContent = count
        onChange(count)
    }

    tally.querySelector('.tally-tap').addEventListener('click', () => set(count + 1))
    tally.querySelector('.tally-undo').addEventListener('click', () => set(count - 1))
    tally.querySelector('.tally-clear').addEventListener('click', () => set(0))

    return {
        reset() {
            count = 0
            countEl.textContent = 0
        }
    }
}

// Start/Pause/Resume countdown that beeps at zero. Returns a function that resets it.
function initCountdown(timer, seconds) {
    const display = timer.querySelector('.timer-display')
    const startBtn = timer.querySelector('.timer-start')
    let remaining = seconds * 1000
    let endAt = null
    let interval = null

    function render() {
        const secs = Math.ceil(remaining / 1000)
        display.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
    }

    function beep() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.frequency.value = 880
            gain.gain.setValueAtTime(0.2, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
            osc.connect(gain).connect(ctx.destination)
            osc.start()
            osc.stop(ctx.currentTime + 0.8)
        } catch (e) { /* audio unavailable */ }
    }

    function pause() {
        clearInterval(interval)
        interval = null
        endAt = null
    }

    function tick() {
        remaining = Math.max(0, endAt - Date.now())
        render()
        if (remaining === 0) {
            pause()
            timer.classList.add('timer-done')
            display.textContent = "Time's up"
            startBtn.textContent = 'Start'
            startBtn.disabled = true
            beep()
        }
    }

    function reset() {
        pause()
        remaining = seconds * 1000
        timer.classList.remove('timer-done', 'timer-running')
        startBtn.textContent = 'Start'
        startBtn.disabled = false
        render()
    }

    startBtn.addEventListener('click', () => {
        if (interval) {
            remaining = Math.max(0, endAt - Date.now())
            pause()
            timer.classList.remove('timer-running')
            startBtn.textContent = 'Resume'
        } else {
            endAt = Date.now() + remaining
            interval = setInterval(tick, 200)
            timer.classList.add('timer-running')
            startBtn.textContent = 'Pause'
        }
    })
    timer.querySelector('.timer-reset').addEventListener('click', reset)

    return reset
}

// Live "right now" card for orientation questions. Fills whichever data-today fields
// the card contains. Location fields (city, state) are looked up only when the button
// is tapped (browser geolocation + BigDataCloud reverse geocoding) and are remembered
// in this browser so they show immediately next time.
function initTodayCard(card) {
    const set = (name, value) => {
        const el = card.querySelector(`[data-today="${name}"]`)
        if (el) el.textContent = value
    }
    const locationFields = ['city', 'state'].filter(name => card.querySelector(`[data-today="${name}"]`))
    const showLocationMessage = msg => set(locationFields[0], msg)
    const locateBtn = card.querySelector('.scorer-today-locate')
    const LOCATION_KEY = 'slp-helper-location'

    function renderNow() {
        const now = new Date()
        set('date', now.getDate())
        set('month', now.toLocaleDateString('en-US', { month: 'long' }))
        set('year', now.getFullYear())
        set('weekday', now.toLocaleDateString('en-US', { weekday: 'long' }))
        set('time', now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
    }
    renderNow()
    setInterval(renderNow, 10000)

    if (!locateBtn) return

    function showLocation(loc) {
        set('city', loc.city)
        set('state', loc.state)
        locateBtn.textContent = 'Update'
    }

    try {
        const saved = JSON.parse(localStorage.getItem(LOCATION_KEY))
        if (saved) showLocation(saved)
    } catch (e) { /* storage unavailable or unreadable */ }

    locateBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showLocationMessage('Location not supported')
            return
        }
        locateBtn.disabled = true
        locateBtn.textContent = 'Locating…'
        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
            try {
                const url = 'https://api.bigdatacloud.net/data/reverse-geocode-client' +
                    `?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`
                const res = await fetch(url)
                if (!res.ok) throw new Error(res.status)
                const data = await res.json()
                const city = data.city || data.locality
                const state = data.principalSubdivision
                if (!city && !state) throw new Error('no location')
                const stateCode = (data.principalSubdivisionCode || '').replace(/^US-/, '')
                const loc = {
                    city: city ? (stateCode ? `${city}, ${stateCode}` : city) : '—',
                    state: state || '—'
                }
                showLocation(loc)
                try { localStorage.setItem(LOCATION_KEY, JSON.stringify(loc)) } catch (e) { /* storage unavailable */ }
            } catch (e) {
                showLocationMessage('Location lookup failed')
                locateBtn.textContent = 'Try again'
            }
            locateBtn.disabled = false
        }, err => {
            showLocationMessage(err.code === err.PERMISSION_DENIED ? 'Location permission denied' : 'Location unavailable')
            locateBtn.textContent = 'Try again'
            locateBtn.disabled = false
        }, { timeout: 15000, maximumAge: 600000 })
    })
}

// PDF report form: optional patient and administrator names plus an editable date that
// stays on today until the user changes it. The administrator name is remembered in this
// browser. buildReport(fields) returns the data printScorerReport needs.
function initReportForm(prefix, buildReport) {
    const patientInput = document.getElementById(`${prefix}-report-patient`)
    const adminInput = document.getElementById(`${prefix}-report-admin`)
    const whenInput = document.getElementById(`${prefix}-report-when`)
    const ADMIN_KEY = 'slp-helper-admin-name'
    let whenEdited = false

    const pad = n => String(n).padStart(2, '0')
    function setWhenToNow() {
        const d = new Date()
        whenInput.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    }

    // Read "YYYY-MM-DD" as a local date (new Date(string) would treat it as UTC midnight)
    function readDate() {
        const [y, m, d] = whenInput.value.split('-').map(Number)
        return y && m && d ? new Date(y, m - 1, d) : null
    }
    setWhenToNow()
    whenInput.addEventListener('input', () => { whenEdited = true })

    try { adminInput.value = localStorage.getItem(ADMIN_KEY) || '' } catch (e) { /* storage unavailable */ }
    adminInput.addEventListener('change', () => {
        try { localStorage.setItem(ADMIN_KEY, adminInput.value.trim()) } catch (e) { /* storage unavailable */ }
    })

    document.getElementById(`${prefix}-report-btn`).addEventListener('click', () => {
        if (!whenEdited) setWhenToNow()
        printScorerReport(buildReport({
            patient: patientInput.value.trim(),
            admin: adminInput.value.trim(),
            when: readDate()
        }))
    })

    return {
        reset() {
            patientInput.value = ''
            whenEdited = false
            setWhenToNow()
        }
    }
}

// Visible label of the selected button for a scored item, without its "(n)" points
// and with line breaks flattened, e.g. "Missed by 2–4 years". Null when unanswered.
function selectedLabel(key) {
    const btn = document.querySelector(`[data-question="${key}"] .bims-btn.selected`)
    if (!btn) return null
    const copy = btn.cloneNode(true)
    copy.querySelectorAll('.bims-pts').forEach(el => el.remove())
    copy.querySelectorAll('br').forEach(el => el.replaceWith(' '))
    return copy.textContent.replace(/\s+/g, ' ').trim()
}

// Copyable one-sentence result: score, interpretation, and the areas where points were lost.
// Within normal limits, lost points are noted without calling them deficits.
function scoreSummary({ subject = 'Patient', test, score, level, normal, areas,
    minor = 'though points were lost in' }) {
    const start = `${subject} scored ${score} on the ${test}, ${level}`
    if (!areas.length) return `${start}, with no deficits noted.`
    if (normal) return `${start}, ${minor} ${listJoin(areas)}.`
    return `${start}, demonstrating deficits in ${listJoin(areas)}.`
}

// Short note for the PDF report's score box, e.g. "Deficits noted in naming and orientation."
// Within normal limits, lost points are noted without calling them deficits.
function areasNote(normal, areas) {
    if (!areas.length) return ''
    return `${normal ? 'Points lost in' : 'Deficits noted in'} ${listJoin(areas)}.`
}

// "a", "a and b", "a, b, and c"
function listJoin(words) {
    if (words.length < 3) return words.join(' and ')
    return `${words.slice(0, -1).join(', ')}, and ${words[words.length - 1]}`
}

// Copies a textarea's text to the clipboard and reports the result in statusEl.
// Highest point value among a scored item's buttons
function maxPoints(key) {
    const btns = document.querySelectorAll(`.bims-item[data-question="${key}"] .bims-btn`)
    return Math.max(...[...btns].map(b => parseInt(b.dataset.value, 10)))
}

function initCopyButton(btn, textEl, statusEl) {
    const flash = msg => {
        statusEl.textContent = msg
        setTimeout(() => (statusEl.textContent = ''), 2500)
    }
    btn.addEventListener('click', async () => {
        if (!textEl.value) {
            flash('Nothing to copy yet.')
            return
        }
        try {
            await navigator.clipboard.writeText(textEl.value)
            flash('Copied to clipboard.')
        } catch (err) {
            textEl.select()
            flash(document.execCommand('copy') ? 'Copied to clipboard.' : 'Copy failed. Please select and copy manually.')
        }
    })
}

// Renders a scorer report into #print-report and opens the print dialog (Save as PDF).
function printScorerReport(r) {
    const esc = v => String(v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))
    const whenText = r.when && !isNaN(r.when)
        ? r.when.toLocaleDateString('en-US', { dateStyle: 'long' })
        : 'Not recorded'

    const unscored = r.sections.flatMap(sec => sec.rows).filter(row => row.points === undefined)

    const mark = row => r.marks === false ? ''
        : row.points === undefined ? '<span class="pr-mark pr-none">–</span>'
            : row.points === row.max ? '<span class="pr-mark pr-ok">✓</span>'
                : row.points === 0 ? '<span class="pr-mark pr-miss">✗</span>'
                    : '<span class="pr-mark pr-part">◐</span>'

    const sectionRows = r.sections.map(sec => {
        const done = sec.rows.every(row => row.points !== undefined)
        const got = sec.rows.reduce((t, row) => t + (row.points ?? 0), 0)
        const max = sec.rows.reduce((t, row) => t + row.max, 0)
        return `<tbody class="pr-group"><tr class="pr-section"><th colspan="4">${esc(sec.title)}</th><td>${done ? got : '—'} / ${max}</td></tr>` +
            sec.rows.map(row => `<tr>
                <td class="pr-num">${esc(row.num)}</td>
                <td>${mark(row)}</td>
                <td>${esc(row.item)}</td>
                <td class="pr-response">${row.response ? esc(row.response) : 'Not scored'}</td>
                <td class="pr-pts">${row.points ?? '—'} / ${row.max}</td>
            </tr>`).join('') + '</tbody>'
    }).join('')

    const cutoffs = r.cutoffs ? `<table class="pr-cutoffs">
            <thead><tr>${r.cutoffs.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
            <tbody>${r.cutoffs.rows.map(row => `<tr><th>${esc(row[0])}</th>${row.slice(1).map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>` : ''

    const details = [
        [r.patientLabel || 'Patient', r.patient || '—'],
        ['Administered by', r.admin || '—'],
        ['Date', whenText],
        ...(r.details || [])
    ]

    const container = document.getElementById('print-report')
    container.classList.toggle('pr-dense', !!r.dense)
    container.innerHTML = `
        <header class="pr-header">
            <h1>${esc(r.title)}</h1>
            <p class="pr-subtitle">${esc(r.subtitle)}</p>
        </header>
        <dl class="pr-details">${details.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <div class="pr-score">
            <div class="pr-result">
                <div class="pr-total">${unscored.length ? '—' : r.total}<span> / ${r.max}</span></div>
                <div class="pr-interp">${esc(r.interpretation)}</div>
                ${r.areasNote ? `<div class="pr-areas">${esc(r.areasNote)}</div>` : ''}
            </div>
            ${cutoffs}
        </div>
        <h2>Item results</h2>
        <table class="pr-items">
            <thead><tr><th>#</th><th></th><th>Item</th><th>Response</th><th>Points</th></tr></thead>
            ${sectionRows}
        </table>
    `

    // The PDF's default file name comes from the page title
    const datePart = r.when && !isNaN(r.when)
        ? `${r.when.getFullYear()}-${String(r.when.getMonth() + 1).padStart(2, '0')}-${String(r.when.getDate()).padStart(2, '0')}`
        : ''
    const pageTitle = document.title
    document.title = [r.filename, r.patient, datePart].filter(Boolean).join(' - ')
    document.body.classList.add('printing-report')
    window.addEventListener('afterprint', () => {
        document.body.classList.remove('printing-report')
        document.title = pageTitle
    }, { once: true })
    window.print()
}
