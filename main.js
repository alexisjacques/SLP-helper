document.addEventListener('DOMContentLoaded', () => {
	const generateBtn = document.getElementById('generateBtn')
	const clearBtn = document.getElementById('clearBtn')
	const copyBtn = document.getElementById('copyBtn')
	const outputEl = document.getElementById('pccOutput')
	const copyStatus = document.getElementById('copyStatus')

	function gatherSelections() {
		const checks = Array.from(document.querySelectorAll('.categories input[type="checkbox"]'))
		return checks.filter(c => c.checked).map(c => c.dataset.label || c.parentElement.textContent.trim())
	}

	function buildOrder(selected) {
		if (!selected.length) return 'No diagnoses selected.'
		// Basic order template - keep concise but editable
		const lines = []
		lines.push('SLP Evaluation and/or Treatment Ordered:')
		selected.forEach((d, i) => lines.push(`${i+1}. ${d}`))
		lines.push('\nIndication: Patient demonstrates communication/feeding concerns as listed. Recommend SLP evaluation to assess and plan appropriate interventions.')
		lines.push('Frequency / Duration: TBD based on evaluation; consider weekly therapy with reassessment in 6-8 weeks.')
		return lines.join('\n')
	}

	generateBtn.addEventListener('click', () => {
		const sel = gatherSelections()
		outputEl.value = buildOrder(sel)
		copyStatus.textContent = ''
		outputEl.focus()
	})

	clearBtn.addEventListener('click', () => {
		document.querySelectorAll('.categories input[type="checkbox"]').forEach(c => c.checked = false)
		outputEl.value = ''
		copyStatus.textContent = ''
	})

	copyBtn.addEventListener('click', async () => {
		const text = outputEl.value
		if (!text) {
			copyStatus.textContent = 'Nothing to copy.'
			return
		}
		try {
			await navigator.clipboard.writeText(text)
			copyStatus.textContent = 'Copied to clipboard.'
			setTimeout(() => copyStatus.textContent = '', 2500)
		} catch (err) {
			// Fallback for older browsers
			outputEl.select()
			try {
				document.execCommand('copy')
				copyStatus.textContent = 'Copied to clipboard.'
				setTimeout(() => copyStatus.textContent = '', 2500)
			} catch (err2) {
				copyStatus.textContent = 'Copy failed. Please select and copy manually.'
			}
		}
	})

	// Allow generating via Enter when focused in categories
	document.querySelectorAll('.categories input[type="checkbox"]').forEach(cb => {
		cb.addEventListener('keydown', e => {
			if (e.key === 'Enter') generateBtn.click()
		})
	})
})

