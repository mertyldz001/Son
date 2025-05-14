import { useEffect } from "react";
import { useGameStore } from "../../lib/stores/useGameStore";
import { useAudio } from "../../lib/stores/useAudio";

const GameOver = () => {
  const { 
    playerHealth, 
    enemyHealth, 
    resetGame,
    round
  } = useGameStore();
  
  const { playSuccess } = useAudio();
  
  // Determine winner
  const isPlayerWinner = enemyHealth <= 0;
  const isDraw = playerHealth <= 0 && enemyHealth <= 0;
  
  // Play victory sound on component mount
  useEffect(() => {
    if (isPlayerWinner) {
      playSuccess();
    }
  }, [isPlayerWinner, playSuccess]);
  
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black/90 text-white">
      <div className="max-w-xl w-full bg-gray-900 rounded-lg p-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-6 text-center">
          {isDraw ? "It's a Draw!" : isPlayerWinner ? "Victory!" : "Defeat!"}
        </h1>
        
        <div className="bg-black/50 p-4 rounded-lg mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-xl">Total Rounds:</span>
            <span className="text-xl">{round}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xl">Final Health:</span>
            <div className="flex gap-4">
              <span className={`text-xl ${isPlayerWinner ? 'text-green-500' : 'text-red-500'}`}>
                You: {playerHealth}
              </span>
              <span className={`text-xl ${!isPlayerWinner && !isDraw ? 'text-green-500' : 'text-red-500'}`}>
                Enemy: {enemyHealth}
              </span>
            </div>
          </div>
        </div>
        
        {isPlayerWinner && (
          <div className="text-center mb-8 text-green-400">
            <p className="text-xl">Congratulations! You've outsmarted your opponent.</p>
          </div>
        )}
        
        {!isPlayerWinner && !isDraw && (
          <div className="text-center mb-8 text-red-400">
            <p className="text-xl">You were defeated. Better luck next time!</p>
          </div>
        )}
        
        {isDraw && (
          <div className="text-center mb-8 text-yellow-400">
            <p className="text-xl">An even match! Both sides fought valiantly.</p>
          </div>
        )}
        
        <div className="flex justify-center gap-4">
          <button
            className="bg-purple-700 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
            onClick={resetGame}
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
