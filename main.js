
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
        const freqSel = selected.find(s => /5x4|3x4|5x2|6visits|6 visits/i.test(s)) || ''
        let freqText = ''
        if (/6visits|6 visits/i.test(freqSel)) freqText = '6 visits in 2 wks'
        else if (/5x4/.test(freqSel)) freqText = '5x/wk x 4wks'
        else if (/3x4/.test(freqSel)) freqText = '3x/wk x 4wks'
        else if (/5x2/.test(freqSel)) freqText = '5x/wk x 2wks'

        // Category code groups
        const dysphagiaCodes = ['R13.12', 'R13.11', 'R13.10', 'I69.391', 'I69.091', 'I69.191', 'I69.291', 'I69.891', 'R13.13', 'R13.14']
        const cogCodes = ['R41.841', 'I69.311', 'I69.319', 'I69.310', 'I69.312', 'I69.314', 'I69.315', 'I69.019', 'I69.119', 'I69.219', 'I69.919']
        const aphasiaCodes = ['R47.01', 'I69.320', 'R48.8', 'I69.020', 'I69.120', 'I69.220', 'I69.820']
        const dysarthriaCodes = ['R47.1', 'R47.89', 'I69.322', 'I68.328', 'I69.122', 'I69.222', 'I69.822']
        const apraxiaCodes = ['I69.390', 'I69.090', 'I69.190', 'I69.290', 'I69.890']
        const otherSpeechCodes = ['I68.328']
        const dysphoniaCodes = ['R49.0', 'R49.8', 'R49.9']
        const aphoniaCodes = ['R49.1']

        const hasDysphagia = matchesAny(dysphagiaCodes)
        const hasCog = matchesAny(cogCodes)
        const hasAphasia = matchesAny(aphasiaCodes)
        const hasDysarthria = matchesAny(dysarthriaCodes)
        const hasApraxia = matchesAny(apraxiaCodes)
        const hasOtherSpeech = matchesAny(otherSpeechCodes)
        const hasDysphonia = matchesAny(dysphoniaCodes)
        const hasAphonia = matchesAny(aphoniaCodes)

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

        header += conds.length ? conds.join(', ') : 'communication / feeding concerns'

        // Which may include
        const includes = []
        if (hasDysphagia) includes.push('oropharyngeal retraining, dysphagia management, PO trials')
        if (hasCog) includes.push('cognitive-linguistic tx')
        if (hasAphasia) includes.push('rec/exp language training')
        if (hasDysarthria || hasApraxia) includes.push('motor speech training')
        if (hasOtherSpeech) includes.push('speech/lang tx')
        if (hasDysphonia || hasAphonia) includes.push('voice tx')

        // PMV trials detection (optional checkbox with 'PMV' or 'check if yes')
        const hasPMV = selected.some(s => /pmv|check if yes/i.test(s))
        if (hasPMV) includes.push('PMV trials')

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
            result = result.replace(/rec\/exp language training/g, 'language tx')
        }
        if (result.length > 500) {
            result = result.replace(/cognitive-linguistic tx/g, 'cog tx')
        }
        if (result.length > 500) {
            result = result.replace(/language, motor speech/g, 'communication')
        }
        if (result.length > 500) {
            result = result.replace(/cognition, communication & voice/g, 'cognition & communication')
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
})

