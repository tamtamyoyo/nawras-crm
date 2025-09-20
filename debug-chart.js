const React = require('react');
const { render } = require('@testing-library/react');

// Simple debug script to isolate the TypeError
const mockData = [
  { name: 'Jan', value: 400, sales: 240 },
  { name: 'Feb', value: 300, sales: 139 },
  { name: 'Mar', value: 200, sales: 980 }
];

const edgeConfig = {
  type: 'bar',
  title: 'Test Chart',
  dataKey: 'value',
  xAxisKey: 'name',
  colors: [], // Empty colors array
  showGrid: true,
  showLegend: true,
  showTooltip: true,
  showBrush: false,
  stacked: false,
  smooth: true,
  fillOpacity: 0.6,
  strokeWidth: 2,
  height: 400
};

console.log('Testing with empty colors array:', edgeConfig.colors);
console.log('Config:', JSON.stringify(edgeConfig, null, 2));