import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Inbox, MessageSquare, Search, Send, UserCheck, Users, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import EmptyState from '@/components/SimpleEmptyState';
import DynamicSEO from '@/components/seo/DynamicSEO';
import {
  useMentors,
  useMyMentorship,
  useRequestMentorship,
  useRespondMentorship,
  useUpdateMentorProfile,
  type MentorResumo,
  type PedidoMentoria,
} from '@/hooks/useMentorship';
import {
  MENTOR_BIO_MAX_CARACTERES,
  PEDIDO_MENSAGEM_MAX,
  TEMAS_SUGERIDOS,
  iniciaisDe,
  parseTemas,
  rotuloStatus,
  temasParaTexto,
  validarPedido,
  validarPerfilMentor,
} from '@/lib/mentorship';

type Aba = 'mentores' | 'pedidos' | 'mentor';

const ABAS: Aba[] = ['mentores', 'pedidos', 'mentor'];

const classeDoStatus = (status: PedidoMentoria['status']) => {
  if (status === 'accepted') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
  if (status === 'completed') return 'bg-primary/10 text-primary border-primary/30';
  if (status === 'pending') return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
  return 'bg-muted text-muted-foreground';
};

const AvatarPessoa = ({ nome, url }: { nome: string; url: string | null }) => (
  <Avatar className="h-10 w-10">
    {url ? <AvatarImage src={url} alt="" /> : null}
    <AvatarFallback>{iniciaisDe(nome)}</AvatarFallback>
  </Avatar>
);

const CartaoMentor = ({ mentor, onPedir }: { mentor: MentorResumo; onPedir: (m: MentorResumo) => void }) => (
  <Card className="border-border/60">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <AvatarPessoa nome={mentor.full_name} url={mentor.avatar_url} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight">{mentor.full_name}</p>
          {mentor.department ? (
            <p className="text-xs text-muted-foreground">{mentor.department}</p>
          ) : null}
        </div>
        {mentor.meu_status === 'pending' ? (
          <Badge variant="outline" className="border-amber-500/30 text-amber-600">Pedido enviado</Badge>
        ) : mentor.meu_status === 'accepted' ? (
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">Mentorando você</Badge>
        ) : null}
      </div>

      {mentor.topics.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Assuntos em que ajuda">
          {mentor.topics.map(tema => (
            <li key={tema}>
              <Badge variant="secondary" className="font-normal">{tema}</Badge>
            </li>
          ))}
        </ul>
      ) : null}

      {mentor.bio ? <p className="text-sm text-muted-foreground">{mentor.bio}</p> : null}

      <Button size="sm" variant="outline" onClick={() => onPedir(mentor)}>
        <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
        Pedir mentoria
      </Button>
    </CardContent>
  </Card>
);

interface CartaoPedidoProps {
  pedido: PedidoMentoria;
  lado: 'recebido' | 'enviado';
  nota: string;
  onNota: (id: string, valor: string) => void;
  onResponder: (id: string, status: PedidoMentoria['status'], nota?: string) => void;
  processando: boolean;
}

const CartaoPedido = ({ pedido, lado, nota, onNota, onResponder, processando }: CartaoPedidoProps) => (
  <Card className="border-border/60">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <AvatarPessoa nome={pedido.pessoa_nome} url={pedido.pessoa_avatar} />
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-tight">
            {lado === 'recebido' ? pedido.pessoa_nome : `${pedido.pessoa_nome}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {lado === 'recebido' ? 'pediu sua mentoria' : 'mentor escolhido'}
            {pedido.pessoa_area ? ` · ${pedido.pessoa_area}` : ''}
          </p>
        </div>
        <Badge variant="outline" className={classeDoStatus(pedido.status)}>{rotuloStatus(pedido.status)}</Badge>
      </div>

      <div>
        <p className="text-sm font-medium">{pedido.topic}</p>
        <p className="text-sm text-muted-foreground">{pedido.message}</p>
      </div>

      {pedido.response_note ? (
        <p className="text-xs rounded-lg bg-muted/60 p-2">
          <span className="font-medium">Recado do mentor:</span> {pedido.response_note}
        </p>
      ) : null}

      {lado === 'recebido' && pedido.status === 'pending' ? (
        <div className="space-y-2">
          <Label htmlFor={`nota-${pedido.id}`} className="text-xs">Combinado (opcional)</Label>
          <Input
            id={`nota-${pedido.id}`}
            value={nota}
            maxLength={1000}
            onChange={evento => onNota(pedido.id, evento.target.value)}
            placeholder="Ex.: te chamo na segunda às 14h"
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={processando} onClick={() => onResponder(pedido.id, 'accepted', nota)}>
              <Check className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Aceitar
            </Button>
            <Button size="sm" variant="outline" disabled={processando} onClick={() => onResponder(pedido.id, 'declined', nota)}>
              <X className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Recusar
            </Button>
          </div>
        </div>
      ) : null}

      {lado === 'recebido' && pedido.status === 'accepted' ? (
        <Button size="sm" variant="outline" disabled={processando} onClick={() => onResponder(pedido.id, 'completed')}>
          <Check className="h-4 w-4 mr-1.5" aria-hidden="true" />
          Marcar como concluída
        </Button>
      ) : null}

      {lado === 'enviado' && (pedido.status === 'pending' || pedido.status === 'accepted') ? (
        <Button size="sm" variant="ghost" disabled={processando} onClick={() => onResponder(pedido.id, 'cancelled')}>
          Cancelar pedido
        </Button>
      ) : null}
    </CardContent>
  </Card>
);

const Mentorship = () => {
    const [params, setParams] = useSearchParams();
  const [busca, setBusca] = useState('');
  const [aba, setAba] = useState<Aba>(() => {
    const pedida = params.get('aba') as Aba | null;
    return pedida && ABAS.includes(pedida) ? pedida : 'mentores';
  });

  const { data: mentores = [], isLoading: carregandoMentores } = useMentors(busca);
  const { data: painel, isLoading: carregandoPainel } = useMyMentorship();
  const atualizarPerfil = useUpdateMentorProfile();
  const pedirMentoria = useRequestMentorship();
  const responder = useRespondMentorship();

  const [souMentor, setSouMentor] = useState(false);
  const [temasTexto, setTemasTexto] = useState('');
  const [bio, setBio] = useState('');
  const [sincronizado, setSincronizado] = useState(false);

  useEffect(() => {
    if (!painel || sincronizado) return;
    setSouMentor(painel.sou_mentor);
    setTemasTexto(temasParaTexto(painel.topics));
    setBio(painel.bio ?? '');
    setSincronizado(true);
  }, [painel, sincronizado]);

  const [mentorAlvo, setMentorAlvo] = useState<MentorResumo | null>(null);
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [notas, setNotas] = useState<Record<string, string>>({});

  const temas = useMemo(() => parseTemas(temasTexto), [temasTexto]);
  const erroPerfil = souMentor ? validarPerfilMentor(temas, bio) : null;
  const erroPedido = validarPedido(assunto, mensagem);

  const recebidos = painel?.recebidos ?? [];
  const enviados = painel?.enviados ?? [];
  const aguardandoMim = recebidos.filter(pedido => pedido.status === 'pending').length;
  const aguardandoMentor = enviados.filter(pedido => pedido.status === 'pending').length;
  const concluidas = [...recebidos, ...enviados].filter(pedido => pedido.status === 'completed').length;

  const trocarAba = (valor: string) => {
    const proxima = valor as Aba;
    setAba(proxima);
    const novos = new URLSearchParams(params);
    novos.set('aba', proxima);
    setParams(novos, { replace: true });
  };

  const abrirPedido = (mentor: MentorResumo) => {
    setMentorAlvo(mentor);
    setAssunto(mentor.topics[0] ?? '');
    setMensagem('');
  };

  const enviarPedido = () => {
    if (!mentorAlvo) return;
    if (erroPedido) {
      toast.error(erroPedido);
      return;
    }
    pedirMentoria.mutate(
      { mentorId: mentorAlvo.user_id, assunto, mensagem },
      { onSuccess: () => setMentorAlvo(null) },
    );
  };

  const salvarPerfil = () => {
    if (erroPerfil) {
      toast.error(erroPerfil);
      return;
    }
    atualizarPerfil.mutate({ is_mentor: souMentor, topics: temas, bio });
  };

  const alternarTema = (tema: string) => {
    const atual = temas.some(item => item.toLowerCase() === tema.toLowerCase());
    const proximos = atual
      ? temas.filter(item => item.toLowerCase() !== tema.toLowerCase())
      : parseTemas([...temas, tema].join(', '));
    setTemasTexto(temasParaTexto(proximos));
  };

  const responderPedido = (id: string, status: PedidoMentoria['status'], nota?: string) => {
    responder.mutate({ id, status, nota });
  };

  return (
        <>
      <AppLayout
      seo={{
        title: "Mentoria entre colegas",
        description: "Encontre quem já domina o assunto e peça mentoria, ou ajude colegas compartilhando o que você sabe.",
        url: "https://multiplixe-v2.vercel.app/mentoria",
      }}
      cabecalho={
        <PageHeader
          titulo="Mentoria"
          subtitulo="Peça ajuda a quem já domina o assunto — ou ajude quem está começando"
          icone={UserCheck}
          gradiente="from-sky-500 to-indigo-500"
        />
      }
      classeConteudo="space-y-6"
    >
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { titulo: 'Mentores disponíveis', valor: mentores.length, icon: Users },
            { titulo: 'Aguardando mentor', valor: aguardandoMentor, icon: Send },
            { titulo: 'Aguardando você', valor: aguardandoMim, icon: Inbox },
            { titulo: 'Mentorias concluídas', valor: concluidas, icon: Check },
          ].map(item => (
            <Card key={item.titulo} className="border-border/60">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  {item.titulo}
                </div>
                {carregandoPainel || carregandoMentores ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{item.valor}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        <Tabs value={aba} onValueChange={trocarAba}>
          <TabsList>
            <TabsTrigger value="mentores">Encontrar mentor</TabsTrigger>
            <TabsTrigger value="pedidos">
              Meus pedidos
              {aguardandoMim > 0 ? <Badge className="ml-2" variant="secondary">{aguardandoMim}</Badge> : null}
            </TabsTrigger>
            <TabsTrigger value="mentor">Ser mentor</TabsTrigger>
          </TabsList>

          <TabsContent value="mentores" className="space-y-4 mt-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                value={busca}
                onChange={evento => setBusca(evento.target.value)}
                placeholder="Buscar por nome, área ou assunto (ex.: Excel)"
                aria-label="Buscar mentores"
                className="pl-9"
              />
            </div>

            {carregandoMentores ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : mentores.length === 0 ? (
              <EmptyState
                icon={Users}
                title={busca ? 'Nenhum mentor para esta busca' : 'Nenhum mentor disponível ainda'}
                description={
                  busca
                    ? 'Tente outro assunto ou peça por nome de quem costuma te ajudar.'
                    : 'Se você domina um assunto, entre na aba "Ser mentor" e apareça aqui para os colegas.'
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {mentores.map(mentor => (
                  <CartaoMentor key={mentor.user_id} mentor={mentor} onPedir={abrirPedido} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pedidos" className="space-y-6 mt-4">
            <section className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Inbox className="h-5 w-5 text-primary" aria-hidden="true" />
                Pedidos que chegaram para você
              </h2>
              {carregandoPainel ? (
                <Skeleton className="h-32 w-full" />
              ) : recebidos.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="Nenhum pedido de mentoria"
                  description="Quando um colega pedir sua ajuda, o pedido aparece aqui e você recebe uma notificação."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {recebidos.map(pedido => (
                    <CartaoPedido
                      key={pedido.id}
                      pedido={pedido}
                      lado="recebido"
                      nota={notas[pedido.id] ?? ''}
                      onNota={(id, valor) => setNotas(anterior => ({ ...anterior, [id]: valor }))}
                      onResponder={responderPedido}
                      processando={responder.isPending}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" aria-hidden="true" />
                Pedidos que você fez
              </h2>
              {carregandoPainel ? (
                <Skeleton className="h-32 w-full" />
              ) : enviados.length === 0 ? (
                <EmptyState
                  icon={Send}
                  title="Você ainda não pediu mentoria"
                  description="Vá para a aba Encontrar mentor, escolha um colega e conte o que você precisa."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {enviados.map(pedido => (
                    <CartaoPedido
                      key={pedido.id}
                      pedido={pedido}
                      lado="enviado"
                      nota=""
                      onNota={() => undefined}
                      onResponder={responderPedido}
                      processando={responder.isPending}
                    />
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="mentor" className="mt-4">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Ser mentor</CardTitle>
                <CardDescription>
                  Mentorar é tirar dúvidas pontuais de quem está começando. Você escolhe os assuntos e recebe um aviso a cada pedido.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-3">
                  <div>
                    <p className="font-medium">Quero aparecer na lista de mentores</p>
                    <p className="text-sm text-muted-foreground">Você pode sair da lista quando quiser.</p>
                  </div>
                  <Switch
                    checked={souMentor}
                    onCheckedChange={setSouMentor}
                    aria-label="Quero ser mentor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temas-mentor">Assuntos em que você ajuda</Label>
                  <Input
                    id="temas-mentor"
                    value={temasTexto}
                    onChange={evento => setTemasTexto(evento.target.value)}
                    placeholder="Ex.: Excel, metas, atendimento"
                    aria-describedby="temas-dica"
                  />
                  <p id="temas-dica" className="text-xs text-muted-foreground">
                    Separe por vírgula. Até 8 assuntos — {temas.length} selecionado(s).
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TEMAS_SUGERIDOS.map(tema => {
                      const ativo = temas.some(item => item.toLowerCase() === tema.toLowerCase());
                      return (
                        <Button
                          key={tema}
                          type="button"
                          size="sm"
                          variant={ativo ? 'default' : 'outline'}
                          onClick={() => alternarTema(tema)}
                        >
                          {tema}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio-mentor">Apresentação</Label>
                  <Textarea
                    id="bio-mentor"
                    value={bio}
                    maxLength={MENTOR_BIO_MAX_CARACTERES}
                    onChange={evento => setBio(evento.target.value)}
                    placeholder="Conte em uma linha como você pode ajudar (ex.: ajudo com fórmulas e tabelas dinâmicas no Excel)."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {bio.trim().length}/{MENTOR_BIO_MAX_CARACTERES} caracteres
                  </p>
                </div>

                {erroPerfil ? <p className="text-sm text-destructive">{erroPerfil}</p> : null}

                <Button onClick={salvarPerfil} disabled={atualizarPerfil.isPending || !!erroPerfil}>
                  {atualizarPerfil.isPending ? 'Salvando...' : 'Salvar perfil de mentor'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
  
      <Dialog open={!!mentorAlvo} onOpenChange={aberto => { if (!aberto) setMentorAlvo(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pedir mentoria para {mentorAlvo?.full_name}</DialogTitle>
            <DialogDescription>
              Conte o que você precisa com clareza: quanto mais objetivo, mais rápido o colega consegue ajudar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assunto-pedido">Assunto</Label>
              <Input
                id="assunto-pedido"
                value={assunto}
                maxLength={120}
                onChange={evento => setAssunto(evento.target.value)}
                placeholder="Ex.: montar tabela dinâmica no Excel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mensagem-pedido">O que você precisa</Label>
              <Textarea
                id="mensagem-pedido"
                value={mensagem}
                maxLength={PEDIDO_MENSAGEM_MAX}
                onChange={evento => setMensagem(evento.target.value)}
                rows={4}
                placeholder="Ex.: preciso cruzar a planilha de vendas com as metas e não sei por onde começar."
              />
              <p className="text-xs text-muted-foreground">
                {mensagem.trim().length}/{PEDIDO_MENSAGEM_MAX} caracteres
              </p>
            </div>
            {erroPedido ? <p className="text-sm text-destructive">{erroPedido}</p> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMentorAlvo(null)}>Cancelar</Button>
            <Button onClick={enviarPedido} disabled={pedirMentoria.isPending || !!erroPedido}>
              {pedirMentoria.isPending ? 'Enviando...' : 'Enviar pedido'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </AppLayout>
    </>
  );
};

export default Mentorship;