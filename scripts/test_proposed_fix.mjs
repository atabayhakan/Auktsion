function testFixedInterpolation(template, params) {
  return Object.entries(params).reduce((str, [k, v]) => {
    return str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
  }, template)
}

const tests = [
  { t: '{n} мүнөт мурун', p: { n: 5 }, expected: '5 мүнөт мурун' },
  { t: '{n} активных лотов', p: { n: 12 }, expected: '12 активных лотов' },
  { t: 'Файл форматы жарамсыз. Кабыл кылынган: {accepted}', p: { accepted: 'PDF, JPG' }, expected: 'Файл форматы жарамсыз. Кабыл кылынган: PDF, JPG' },
  { t: 'Салам {name}, баланс: {balance} сом', p: { name: 'Азамат', balance: 5000 }, expected: 'Салам Азамат, баланс: 5000 сом' },
  { t: '{n} мүнөт мурун', p: { n: 0 }, expected: '0 мүнөт мурун' },
  { t: '{n} мүнөт мурун', p: { n: -10 }, expected: '-10 мүнөт мурун' },
  { t: '{n} мүнөт мурун', p: { n: '' }, expected: ' мүнөт мурун' },
  { t: '{n} мүнөт мурун', p: { n: '$100 & $200' }, expected: '$100 & $200 мүнөт мурун' },
  { t: '{n} мүнөт мурун', p: { n: '<script>alert(1)</script>' }, expected: '<script>alert(1)</script> мүнөт мурун' },
]

for (const t of tests) {
  const result = testFixedInterpolation(t.t, t.p)
  console.log(result === t.expected ? '✅ PASS' : '❌ FAIL', `Got: "${result}", Expected: "${t.expected}"`)
}
