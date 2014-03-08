/*
  spindle_control.c - spindle control methods
  Part of Grbl

  Copyright (c) 2009-2011 Simen Svale Skogsrud
  Copyright (c) 2012 Sungeun K. Jeon

  Grbl is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Grbl is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Grbl.  If not, see <http://www.gnu.org/licenses/>.
*/

#include "settings.h"
#include "spindle_control.h"
#include "planner.h"

#include <avr/io.h>
#include <avr/interrupt.h>

static uint8_t current_direction;

#define MAX 65535
#define WHERE_OFFSET 40000
#define WHERE_BASELINE 2000

void spindle_init()
{
  current_direction = 0;
  SPINDLE_ENABLE_DDR |= (1<<SPINDLE_ENABLE_BIT);
  SPINDLE_DIRECTION_DDR |= (1<<SPINDLE_DIRECTION_BIT);
  spindle_run(1, 100);
}

int spindle_where = 2000, spindle_up, phase=0;
uint16_t speed = 0;
void spindle_stop() {
  spindle_up = -5;
}


#ifdef TCNT1
  ISR(TIMER1_OVF_vect) {

     spindle_where+=spindle_up;
     if (spindle_up < 0 && spindle_where <= 2000) {
      //TCCR1B = 0;
      spindle_where = 100;
     } else {

      if (spindle_where > speed) {
        spindle_where = speed;
      }

      if (phase) {
        TCNT1 = MAX-(WHERE_OFFSET - spindle_where);
        SPINDLE_ENABLE_PORT &= ~(1<<SPINDLE_ENABLE_BIT);
      } else {
        SPINDLE_ENABLE_PORT |= 1<<SPINDLE_ENABLE_BIT;
        TCNT1 = MAX-spindle_where;
      }

       phase = (phase) ? 0 : 1;
     }
  }
#endif

void spindle_run(int8_t direction, uint16_t rpm)
{
  #ifdef TCNT1
    TIMSK1 |= (1 << TOIE1); // Enable overflow interrupt
    TCNT1 = MAX-(WHERE_OFFSET-spindle_where); // Preload timer with precalculated value
    TCCR1B |= (1 << CS11);

    if (direction && rpm) {
      spindle_up = 5;

      // Using a bigfoot 160:
      //  245KV @ 34v DC = 8330rpm
      //  minimal cycle time: 2.5ms
      //  max cycle time: 1.1ms
      //  1100/8330 = 0.13205282112845138 step size

      speed = rpm*0.13205282112845138 + WHERE_BASELINE;
    } else {
      spindle_stop();
    }
  #endif

}
