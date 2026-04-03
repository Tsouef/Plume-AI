// Aggregates all shadow-DOM CSS files into a single string for injection.
// Each file is co-located with its component for maintainability.
import grammarPanelStyles from './GrammarPanel.css?raw'
import panelHeaderStyles from './PanelHeader/PanelHeader.css?raw'
import spinnerStyles from './Spinner/Spinner.css?raw'
import textPreviewStyles from './TextPreview/TextPreview.css?raw'
import aiResultViewStyles from './AIResultView/AIResultView.css?raw'
import translateBarStyles from './TranslateBar/TranslateBar.css?raw'
import tonePillsBarStyles from './TonePillsBar/TonePillsBar.css?raw'

export const panelStyles = [
  grammarPanelStyles,
  panelHeaderStyles,
  spinnerStyles,
  textPreviewStyles,
  aiResultViewStyles,
  translateBarStyles,
  tonePillsBarStyles,
].join('\n')
