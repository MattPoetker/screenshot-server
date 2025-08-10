# CSS Setup with Tailwind CSS

This project now uses Tailwind CSS for styling, providing better maintainability and scalability.

## Development Workflow

### Building CSS for Development (with watch mode)
```bash
npm run build-css
```
This watches for changes and rebuilds automatically.

### Building CSS for Production
```bash
npm run build-css-prod
```
This creates a minified version.

## Project Structure

```
src/
  input.css          # Tailwind input file with custom components
public/
  css/
    tailwind.css     # Generated output (gitignored)
    style.css.backup # Old custom CSS (for reference)
```

## Custom Components

The project includes custom Tailwind components for:

- `.card` - Glassmorphism cards
- `.btn` - Button variants (primary, secondary)
- `.modal-overlay` - Modal system with animations
- `.stats-card` - Dashboard statistics cards
- `.api-key-card` - API key display cards
- `.toast` - Notification toasts
- And more...

## Configuration

- `tailwind.config.js` - Tailwind configuration with custom colors and animations
- `postcss.config.js` - PostCSS configuration
- Custom glassmorphism background and component styles

## Color Palette

- **Primary**: Indigo (default Tailwind indigo-500, 600, 700)
- **Secondary**: Purple (a855f7)
- **Accent**: Green (22c55e)
- **Background**: Gradient glassmorphism effect

## Migration Notes

- Replaced custom CSS variables with Tailwind utilities
- Maintained existing glassmorphism design aesthetic  
- All modal animations and interactions preserved
- Component classes available for consistent styling