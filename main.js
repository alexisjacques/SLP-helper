
// main.js — single clean implementation
document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn')
    const clearBtn = document.getElementById('clearBtn')
    const copyBtn = document.getElementById('copyBtn')
    const outputEl = document.getElementById('pccOutput')
    const copyStatus = document.getElementById('copyStatus')

    // per-toggle storage keys will be generated dynamically per container

    function gatherSelections() {
        const checks = Array.from(document.querySelectorAll('.categories input[type="checkbox"]'))
        return checks.filter(c => c.checked).map(c => c.dataset.label || c.parentElement.textContent.trim())
    }

    function buildOrder(selected) {
        if (!selected || !selected.length) return 'No diagnoses selected.'
        const lines = []
        lines.push('SLP Evaluation and/or Treatment Ordered:')
        selected.forEach((d, i) => lines.push(`${i + 1}. ${d}`))
        lines.push('\nIndication: Patient demonstrates communication/feeding concerns as listed. Recommend SLP evaluation to assess and plan appropriate interventions.')
        lines.push('Frequency / Duration: TBD based on evaluation; consider weekly therapy with reassessment in 6-8 weeks.')
        return lines.join('\n')
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const sel = gatherSelections()
            outputEl.value = buildOrder(sel)
            copyStatus.textContent = ''
            outputEl.focus()
        })
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

