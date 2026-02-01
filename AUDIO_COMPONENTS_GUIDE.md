# Guia de Componentes de Áudio

Componentes copiados de `ia-rimas-brasil` para `verso-genius-unified`.

## ✅ Arquivos Copiados

### Componentes UI
```
src/ui/components/audio/
├── BeatPlayer.tsx          # Player de batidas com controles
├── Metronome.tsx          # Metrônomo visual (+ MetronomeCompact)
├── FreestyleRecorder.tsx  # Gravador de freestyle com microfone
└── index.ts               # Barrel export
```

### Serviços
```
src/services/
├── audioService.ts        # Web Audio API (playback de beats)
├── recordingService.ts    # MediaRecorder API (gravação)
└── index.ts              # Barrel export
```

---

## 📦 Uso dos Componentes

### 1. BeatPlayer

Player de batidas com controles completos.

```tsx
import { BeatPlayer } from '@/ui/components/audio'

function ExercisePage() {
  return (
    <div>
      <BeatPlayer />
    </div>
  )
}
```

**Features:**
- Seleção de beats (CC0 license)
- Controles play/pause/stop
- Volume control com mute
- Progress bar
- BPM display
- Loop automático

---

### 2. Metronome

Metrônomo visual sincronizado com BPM.

```tsx
import { Metronome, MetronomeCompact } from '@/ui/components/audio'

function ExercisePage() {
  const [bpm, setBpm] = useState(90)
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div>
      {/* Versão completa */}
      <Metronome bpm={bpm} isPlaying={isPlaying} showVisual={true} />

      {/* Versão compacta */}
      <MetronomeCompact bpm={bpm} isPlaying={isPlaying} />
    </div>
  )
}
```

**Features:**
- Animação visual sincronizada (4/4)
- Pulso central com framer-motion
- Indicador de batida
- Cálculo de intervalo (ms)
- Status ativo/inativo

---

### 3. FreestyleRecorder

Gravador de freestyle com playback.

```tsx
import { FreestyleRecorder } from '@/ui/components/audio'

function ProductionExercise() {
  const handleRecordingComplete = (recording) => {
    console.log('Gravação concluída:', recording)
    // Salvar no Supabase, enviar para avaliação, etc
  }

  return (
    <FreestyleRecorder
      beatBpm={90}
      beatIsPlaying={true}
      onRecordingComplete={handleRecordingComplete}
    />
  )
}
```

**Features:**
- Solicitação de permissão de microfone
- Gravação com MediaRecorder API
- Timer de duração
- Playback com waveform visual
- Download da gravação (.webm)
- LocalStorage para histórico
- Integração com metrônomo

---

## 🔧 Serviços

### AudioService

Gerencia playback de beats usando Web Audio API.

```typescript
import { getAudioService, CC0_BEATS } from '@/services'

const audioService = getAudioService()

// Carregar beat
await audioService.loadBeat(CC0_BEATS[0].url)

// Play/Pause
audioService.play()
audioService.pause()

// Volume
audioService.setVolume(0.7) // 0-1

// Estado
const state = audioService.getState()
console.log(state.currentTime, state.duration, state.isPlaying)
```

---

### RecordingService

Gerencia gravação de áudio com microfone.

```typescript
import { getRecordingService, RecordingStorage } from '@/services'

const recordingService = getRecordingService()

// Solicitar permissão
await recordingService.requestMicrophoneAccess()

// Gravar
recordingService.startRecording()

// Parar e obter Recording
const recording = await recordingService.stopRecording()

// Salvar metadata
RecordingStorage.saveRecording({
  id: recording.id,
  duration: recording.duration,
  timestamp: recording.timestamp,
  bpm: 90
})

// Listar gravações
const recordings = RecordingStorage.getRecordings()
```

---

## 🎵 Beats CC0 Incluídos

O `audioService.ts` já vem com 4 beats pré-configurados (CC0 license):

1. **Boom Bap Classic** - 90 BPM
2. **Trap Moderno** - 140 BPM
3. **Old School 808** - 85 BPM
4. **Freestyle Flow** - 95 BPM

**⚠️ IMPORTANTE:** Os arquivos de áudio precisam ser adicionados em:
```
verso-genius-unified/public/assets/beats/
├── boom-bap-90bpm.mp3
├── trap-140bpm.mp3
├── old-school-85bpm.mp3
└── freestyle-95bpm.mp3
```

**Fontes recomendadas para beats CC0:**
- [Free Music Archive](https://freemusicarchive.org/)
- [Incompetech](https://incompetech.com/music/)
- [ccMixter](https://ccmixter.org/)

---

## 🔗 Integração Sugerida

### ExercisePage (com BeatPlayer + Metronome)

```tsx
import { BeatPlayer } from '@/ui/components/audio'
import { MetronomeCompact } from '@/ui/components/audio'

export function ExercisePage() {
  const [bpm, setBpm] = useState(90)
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="space-y-6">
      {/* Beat Player */}
      <BeatPlayer />

      {/* Exercise Content */}
      <div className="bg-dark-300 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2>Exercício de Rima</h2>
          <MetronomeCompact bpm={bpm} isPlaying={isPlaying} />
        </div>

        {/* Exercise content */}
      </div>
    </div>
  )
}
```

---

### ProductionExercise (com FreestyleRecorder)

```tsx
import { FreestyleRecorder } from '@/ui/components/audio'
import { supabase } from '@/config/supabase'

export function ProductionExercise() {
  const handleRecordingComplete = async (recording) => {
    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from('recordings')
      .upload(`user-${userId}/${recording.id}.webm`, recording.blob)

    if (!error) {
      // Salvar metadata no banco
      await supabase.from('user_recordings').insert({
        user_id: userId,
        recording_url: data.path,
        duration: recording.duration,
        bpm: recording.bpm,
      })
    }
  }

  return (
    <div className="space-y-6">
      <h1>Produção de Freestyle</h1>

      <FreestyleRecorder
        beatBpm={90}
        beatIsPlaying={true}
        onRecordingComplete={handleRecordingComplete}
      />
    </div>
  )
}
```

---

## 📋 Checklist de Integração

- [x] Componentes copiados para `src/ui/components/audio/`
- [x] Serviços copiados para `src/services/`
- [x] Barrel exports criados
- [ ] Adicionar beats CC0 em `public/assets/beats/`
- [ ] Integrar BeatPlayer em ExercisePage
- [ ] Integrar FreestyleRecorder em ProductionExercise
- [ ] Criar schema Supabase para `user_recordings` (se necessário)
- [ ] Testar permissão de microfone
- [ ] Testar playback de beats
- [ ] Testar gravação e download

---

## 🎯 Próximos Passos

1. **Obter Beats CC0:** Baixar 4 beats das fontes recomendadas
2. **Criar estrutura de assets:** `public/assets/beats/`
3. **Integrar nas páginas existentes:** ExercisePage, ProductionExercise
4. **Testar no navegador:** Verificar permissões e playback
5. **Schema Supabase (opcional):** Tabela `user_recordings` para persistir gravações

---

## 🔗 Dependências

Esses componentes dependem de:
- `framer-motion` (animações)
- `lucide-react` (ícones)
- Web Audio API (nativo)
- MediaRecorder API (nativo)

Todas já estão no `package.json` do verso-genius-unified.

---

✅ **Status:** Componentes copiados e prontos para uso!
