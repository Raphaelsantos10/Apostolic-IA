import { completeOnboarding, skipOnboarding } from "../../onboarding/actions";

type Params = Promise<{ erro?: string }>;
const questions: ReadonlyArray<readonly [string, readonly string[]]> = [
  ["Quem conduziu Israel para fora do Egito?", ["Abraão", "Moisés", "Davi"]],
  ["Quantos Evangelhos existem no Novo Testamento?", ["3", "5", "4"]],
  ["Qual livro começa com a criação?", ["Gênesis", "Salmos", "Mateus"]],
  ["Quem escreveu muitas cartas do Novo Testamento?", ["Pedro", "Paulo", "Isaías"]],
  ["Em qual livro lemos sobre a Igreja Primitiva?", ["Romanos", "Hebreus", "Atos"]]
];

export default async function OnboardingPage({ searchParams }: Readonly<{ searchParams: Params }>) {
  const { erro } = await searchParams;
  return (
    <>
      <p className="eyebrow">Boas-vindas</p><h1>Prepare a sua jornada</h1>
      <p className="auth-intro">As respostas servem apenas para montar um ponto de partida e podem ser alteradas.</p>
      {erro && <p className="auth-message auth-error" role="alert">{erro}</p>}
      <form className="auth-form onboarding-form" action={completeOnboarding}>
        <fieldset><legend>Objetivos de estudo</legend>
          {["biblia|Compreender a Bíblia", "doutrina|Aprender doutrina", "oracao|Fortalecer a oração", "ministerio|Servir no ministério"].map((item) => {
            const [value, label] = item.split("|");
            return <label className="checkbox-field" key={value}><input type="checkbox" name="goals" value={value}/><span>{label}</span></label>;
          })}
        </fieldset>
        <label className="field"><span>Experiência</span><select name="experience"><option value="beginner">Iniciante</option><option value="intermediate">Intermédia</option><option value="advanced">Avançada</option></select></label>
        <label className="field"><span>Minutos disponíveis por semana</span><input type="number" name="weeklyMinutes" min="15" max="840" defaultValue="60" required/></label>
        <fieldset><legend>Avaliação inicial</legend>
          {questions.map(([question, options], index) => <div key={question} className="assessment-question"><strong>{index + 1}. {question}</strong>{options.map((option, optionIndex) => <label className="checkbox-field" key={option}><input type="radio" name={`q${index + 1}`} value={String.fromCharCode(97 + optionIndex)} required/><span>{option}</span></label>)}</div>)}
        </fieldset>
        <button className="button button-primary" type="submit">Criar plano inicial</button>
      </form>
      <form className="auth-form" action={skipOnboarding}><button className="button button-secondary" type="submit">Fazer mais tarde</button></form>
    </>
  );
}
