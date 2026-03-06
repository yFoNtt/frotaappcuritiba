export function getWeakPasswordMessage(error: any): string | null {
  const msg = error?.message?.toLowerCase() || '';
  if (msg.includes('weak_password') || msg.includes('pwned') || msg.includes('leaked') || msg.includes('data breach')) {
    return 'Esta senha foi encontrada em vazamentos de dados conhecidos. Por segurança, escolha uma senha diferente.';
  }
  if (msg.includes('weak') || msg.includes('too short') || msg.includes('too common')) {
    return 'Senha muito fraca. Use uma combinação de letras, números e caracteres especiais.';
  }
  return null;
}
