import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FormMovimento } from './FormMovimento.tsx';

function renderForm() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <FormMovimento modo="saida" />
    </QueryClientProvider>,
  );
}

describe('FormMovimento (saída)', () => {
  it('valida quantidade inteira > 0', async () => {
    renderForm();
    const botao = await screen.findByRole('button', { name: /Registar/i });
    fireEvent.click(botao);
    expect(await screen.findByText(/Deve ser > 0/i)).toBeInTheDocument();
  });

  it('trata 409 STOCK_INSUFICIENTE com mensagem amigável', async () => {
    renderForm();
    const select = await screen.findByRole('combobox');
    await waitFor(() => expect(select.querySelectorAll('option').length).toBeGreaterThan(1));
    fireEvent.change(select, { target: { value: '5' } }); // material esgotado no mock
    const qtd = screen.getByRole('spinbutton');
    fireEvent.change(qtd, { target: { value: '1' } });
    fireEvent.click(await screen.findByRole('button', { name: /Registar/i }));
    expect(await screen.findByText(/Stock insuficiente/i)).toBeInTheDocument();
  });
});